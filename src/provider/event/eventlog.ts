import { WebSocket as WebSock } from "./ws";
import type {
  Network,
  NetworkType,
} from '../types';

import {
  EventEmitter,
  EventListener,
  LogFilter,
  WebSocketCreator,
  WebSocketLike,
} from './index';

import {
  formatEventLog,
} from '../formatter';

import {
  BTPError,
  ERR_NOT_IMPLEMENTED,
  ERR_UNKNOWN_NETWORK_TYPE,
} from '../../error/index';

export interface LogEvent {
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

    ws.onmessage = (event: { data: ArrayBuffer }) => {
      const payload = JSON.parse(event.data.toString());
      // the following message will be received, when the connection has opened
      // data == { code: 0, event: '', data: null }
      if (payload.code != undefined) {
        return;
      }
      // TODO supports to fire finalized events 
      listener(undefined, formatEventLog((filter.network as Network).type as NetworkType, payload));
      if (once) {
        ws.close();
      }
    };

    ws.onclose = (ev: any) => {
      console.error(ev.code, ev.reason);
    };

    ws.onerror = (ev: any) => {
      console.error(ev);
      throw new BTPError(ERR_NOT_IMPLEMENTED);
    };

    return this;
  }

  off(name: string): void;
  off(name: string, listener: EventListener): void;
  off(name: string, listener?: EventListener): void {
    throw new Error('TODO');
  }

}
