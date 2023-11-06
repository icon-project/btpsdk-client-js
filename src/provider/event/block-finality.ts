import {
  assert,
  BTPError,
  ERR_INCONSISTENT_BLOCK,
  ERR_UNSUPPORTED,
} from "../../error/index";

import {
  Provider,
} from '../types';

import {
  BlockFilter,
  EventListener,
  EventEmitter,
} from './index';

import {
  getLogger
} from '../../utils/log';

interface PoolItem {
  id: string;
  height: number;
  listeners: Array<EventListener>;
}

type Timer = ReturnType<typeof setInterval>;

const log = getLogger('block-finality-emitter');

export class BlockFinalityEmitter implements EventEmitter {
  #provider: Provider;
  #pools: Map<string, Array<PoolItem>> = new Map();
  #timers: Map<string, Timer> = new Map();
  #interval: number = 1000;

  constructor(provider: Provider, opts: { interval: number } = { interval: 1000 }) {
    this.#provider = provider;
  }

  on(name: string, filter: any, listener: EventListener): this {
    throw new BTPError(ERR_UNSUPPORTED);
  }

  once(name: string, filter: BlockFilter, listener: EventListener): this {
    log.debug(`once(${name}, ${JSON.stringify(filter)})`);
    //log.debug('++once', name, filter)
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
    log.info('no listener');
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
    log.debug(`start(${network})`);
    const pool = this.#pools.get(network);
    if (pool == null || pool.length == 0) {
      log.info(`no available event target - target netowrk(${network})`);
      this.#stop(network);
      return;
    }
    const item = pool.at(0)!!;
    let finality = false;
    let error: undefined | BTPError = undefined;
    try {
      finality = await this.#provider.getBlockFinality(network, item.id, item.height);
    } catch (err) {
      assert(BTPError.is(err, ERR_INCONSISTENT_BLOCK), `[TODO] handler other errors - error: ${err}`);
      finality = true;
      if (err instanceof BTPError) {
        error = err;
      }
    } finally {
      if (finality) {
        for (const listener of item.listeners) {
          log.debug('notify events');
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
    log.debug(`pause(${network})`);
    if (this.#timers.has(network)) {
      this.#stop(network);
      handler();
      this.#start(network);
    } else {
      handler();
    }
  }
}
