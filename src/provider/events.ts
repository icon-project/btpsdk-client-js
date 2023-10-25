import { assert } from "../utils/errors";
import { WebSocket as WebSock } from "./ws";
import { join } from "../utils";
import {
  BTPError,
  ERRORS
} from "../utils/errors";
import type {
  EventFilter,
  BlockFilter,
  LogFilter,
  Network,
  NetworkType,
  Provider,
} from "./types";

type EventListener = (...args: Array<any>) => void;

export function isBlockFilter(filter: EventFilter): filter is BlockFilter {
  return "status" in filter && filter.status === 'finalized';
}

export function isLogFilter(filter: EventFilter): filter is LogFilter {
  return "event" in filter;
}

export interface EventEmitter {
  on(name: string, filter: EventFilter, listener: EventListener): this;
  once(name: string, filter: EventFilter, listener: EventListener): this;
  off(name: string): void;
  off(name: string, listener: EventListener): void;
}

interface LogEvent {
  block: {
    id: string;
    height: number;
  },
  tx: {
    id: string;
    index: number;
  },
  index: number;
  payload: {
    name: string;
    params: Map<string, any>;
  }
}

interface BlockEvent {
}

const formatters: { [type in NetworkType]: ((message: any) => LogEvent) } = {
  'icon': (message: any) => {
    return {
      block: {
        id: message.BaseEvent.BlockHash,
        height: message.BaseEvent.BlockHeight,
      },
      tx: {
        id: message.BaseEvent.TxHash,
        index: message.BaseEvent.TxIndex,
      },
      index: message.BaseEvent.IndexInTx,
      payload: {
        name: message.Name,
        params: message.Params
      }
    }
  },
  'eth': (message: any): LogEvent => {
    return {
      block: {
        id: message.BaseEvent.Raw.blockHash,
        height: Number.parseInt(message.BaseEvent.Raw.blockNumber, 16),
      },
      tx: {
        id: message.BaseEvent.Raw.transactionHash,
        index: 0,
      },
      index: 0,
      payload: {
        name: message.Name,
        params: message.Params
      }
    }
  }
};

interface PoolItem {
  id: string;
  height: number;
  listeners: Array<EventListener>;
}

type Timer = ReturnType<typeof setInterval>;

export class BlockFinalityEmitter implements EventEmitter {
  #provider: Provider;
  #pools: Map<string, Array<PoolItem>> = new Map();
  #timers: Map<string, Timer> = new Map();
  #interval: number = 1000;

  constructor(provider: Provider, opts: { interval: number } = { interval: 1000 }) {
    this.#provider = provider;
  }

  on(name: string, filter: EventFilter, listener: EventListener): this {
    throw new BTPError(ERRORS.GENERAL.UNSUPPORTED_OP, { operation: "BlockFinalityEmitter::on" });
  }

  once(name: string, filter: BlockFilter, listener: EventListener): this {
    const network = typeof(filter.network) === 'string'
      ? filter.network
      : (filter.network.name as string);

    if (!this.#pools.has(network)) {
      this.#pools.set(network, []);
    }

    const pool = this.#pools.get(network)!!;
    const item = pool.find(o => o.height == filter.height && o.id == filter.id);
    if (item !== undefined) {
      item.listeners.push(listener);
      return this;
    }

    const pos = pool.findIndex(o => o.height > filter.height);
    const newItem: PoolItem = {
      id: filter.id,
      height: filter.height,
      listeners: [ listener ]
    };
    if (pos >= 0) {
      pool.splice(pos, 0, newItem);
    } else {
      pool.push(newItem);
    }

    if (!this.#timers.has(network)) {
      this.#start(network);
    }
    return this;
  }

  off(name: string): void;
  off(name: string, listener: EventListener): void;
  off(name: string, listener?: EventListener): void {
    listener != null ? this.#off(name, listener) : this.#offAll(name);
  }

  #off(_: string, listener: EventListener): void {
    for (const [ network, pool ] of this.#pools.entries()) {
      this.#pause(network, () => {
        for (const item of pool) {
          const index = item.listeners.indexOf(listener);
          if (index >= 0) {
            item.listeners.splice(index, 1);
            return;
          }
        }
      });
    }
    throw new Error('no listener');
  }

  #offAll(name: string): void {
    for (const network of this.#pools.keys()) {
      if (this.#timers.has(network)) {
        this.#stop(network);
        this.#pools.delete(network);
      }
    }
  }

  async #start(network: string) {
    const pool = this.#pools.get(network);
    if (pool == null || pool.length == 0) {
      this.#stop(network);
      return;
    }
    const item = pool.at(0)!!;
    let finality = false;
    let error: undefined | BTPError = undefined;
    try {
      finality = await this.#provider.getBlockFinality(network, item.id, item.height);
    } catch (err) {
      assert(BTPError.is(err, ERRORS.NETWORK.INCONSISTENT_BLOCK), `[TODO] handler other errors - error: ${err}`);
      finality = true;
      if (err instanceof BTPError) {
        error = err;
      }
    } finally {
      if (finality) {
        for (const listener of item.listeners) {
          listener(error);
        }
        pool.shift();
      }
    }

    this.#timers.set(network, setTimeout(this.#start.bind(this, network), !finality ? this.#interval : 0));
  }

  #stop(network: string) {
    const timer = this.#timers.get(network);
    if (timer != null) {
      clearTimeout(timer);
      this.#timers.delete(network);
    }
  }

  #pause(network: string, handler: () => void) {
    if (this.#timers.has(network)) {
      this.#stop(network);
      handler();
      this.#start(network);
    } else {
      handler();
    }
  }
}

export interface WebSocketLike {
  onopen: null | ((ev: any) => any);
  onclose: null | ((ev: any) => any);
  onmessage: null | ((ev: { data: ArrayBuffer }) => any);
  onerror: null | ((ev: any) => any);
  send(payload: any): void;
  close: (() => void);
}

export type WebSocketCreator = () => WebSocketLike;

export class LogEmitter implements EventEmitter {
  #url: string | WebSocketCreator;

  constructor(url: string | WebSocketCreator) {
    this.#url = url;
  }

  on(name: string, filter: LogFilter, listener: EventListener): this {
    return this.#on(name, filter, listener, false);
  }

  once(name: string, filter: LogFilter, listener: EventListener): this {
    return this.#on(name, filter, listener, true);
  }

  #on(name: string, filter: LogFilter, listener: EventListener, once: boolean): this {
    const ws = typeof(this.#url) === 'string'
      ? new WebSock(`${this.#url}/monitor/${filter.service}/event`)
      : this.#url();
    ws.onopen = () => {
      ws.send(JSON.stringify({
        network: typeof(filter.network) == 'string' ? filter.network : filter.network.name,
        service: filter.service,
        nameToParams: {
          [filter.event.name]: filter.event.params ?? null
        }
      }));
    };

    if (typeof(filter.network) == 'string') {
      filter.network = { name: filter.network, type: 'icon' };
    }
    const formatter = formatters[filter.network.type as NetworkType]
      ?? (() => { throw new BTPError(ERRORS.NETWORK.NOT_FOUND); })();

    ws.onmessage = (event: { data: ArrayBuffer }) => {
      const payload = JSON.parse(event.data.toString());
      // the following message will be received, when the connection has opened
      // data == { code: 0, event: '', data: null }
      if (payload.code != undefined) {
        return;
      }
      // TODO supports to fire finalized events 
      listener(undefined, formatter(payload));
      if (once) {
        ws.close();
      }
    };

    ws.onclose = (ev: any) => {
      console.error(ev.code, ev.reason);
    };

    ws.onerror = (ev: any) => {
      console.error(ev);
      throw new BTPError(ERRORS.GENERAL.NOT_IMPLEMENTED);
    };

    return this;
  }

  off(name: string): void;
  off(name: string, listener: EventListener): void;
  off(name: string, listener?: EventListener): void {
  }

}
