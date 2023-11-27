/**
 * @typedef {Object} EventLog
 * @property {Object} block
 * @property {string} block.id
 * @property {number} block.height
 * @property {Object} tx
 * @property {string} tx.id
 * @property {number} tx.index
 * @property {number} index
 * @property {Object} payload
 * @property {string} playload.name
 * @property {Map<string, any>} playload.params
 * @memberof @iconfoundation/btpsdk
 */

import { WebSocket as WebSock } from "./ws";
import { formatEventLog } from './format';
import { getLogger } from '../utils/log';
import type {
  Network,
  NetworkType,
} from './provider';

import {
  EventEmitter,
  EventListener,
  WebSocketCreator,
  WebSocketLike,
} from './index';


import {
  BTPError,
  ERR_NOT_IMPLEMENTED,
  ERR_ILLEGAL_STATE,
  ERR_CLOSED_WS,
} from '../error/index';

const log = getLogger('eventlog');

export interface LogFilter {
  network: Network;
  service: string;
  event: {
    name: string;
    params?: Map<string, any> | Array<Map<string, any>>;
  }
}

export interface EventLog {
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

export class LogEmitter implements EventEmitter<LogFilter> {
  #url: string | WebSocketCreator;
  #ws?: WebSocketLike;
  #listener?: EventListener;

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
      ? new WebSock(`${this.#url}/monitor/${filter.service}/event`) as WebSocketLike
      : this.#url();
    this.#ws = ws;
    this.#listener = listener;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        network: filter.network.name,
        service: filter.service,
        nameToParams: {
          [filter.event.name]: filter.event.params ?? null
        }
      }));
    };

    ws.onmessage = (event: { data: ArrayBuffer }) => {
      const payload = JSON.parse(event.data.toString());
      // the following message will be received, when the connection has opened
      // data == { code: 0, event: '', data: null }
      if (payload.code != undefined) {
        return;
      }
      // TODO supports to fire finalized events 
      if (this.#listener != null) {
        this.#listener(undefined, formatEventLog(filter.network.type as NetworkType, payload));
      }
      if (once) {
        ws.close(1000);
      }
    };

    ws.onclose = (ev: { code: number, reason: string }) => {
      if (ev.code !== 1000 && this.#listener != null) {
        log.warn(`ws connection closed - code(${ev.code}) reason(${ev.reason})`);
        this.#listener(new BTPError(ERR_CLOSED_WS, ev));
      }
      if (this.#ws != null && this.#ws === ws) {
        this.#ws = undefined;
        this.#listener = undefined;
      }
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
    if (listener != null) {
      if (this.#listener !== listener) {
        throw new BTPError(ERR_ILLEGAL_STATE);
      }
    }
    if (this.#ws == null) {
      throw new BTPError(ERR_ILLEGAL_STATE);
    }
    this.#ws.close(1000);
  }

}
