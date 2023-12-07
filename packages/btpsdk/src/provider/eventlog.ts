/*
 * Copyright 2023 ICON Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  BtpError,
  ErrorCode,
  assert,
  invalidArgument,
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
        log.debug('try to close ws connection with code-1000');
        ws.close(1000);
      }
    };

    ws.onclose = (ev: { code: number, reason: string }) => {
      log.debug(`ws conn has been closed - code(${ev.code}) reason(${ev.reason})`);
      if (ev.code !== 1000 && this.#listener != null) {
        this.#listener(new BtpError(ErrorCode.ClosedConnection, `ws code(${ev.code}) reason(${ev.reason})`), ev);
      }
      this.#ws = undefined;
      this.#listener = undefined;
    };

    ws.onerror = (ev: any) => {
      log.error(ev);
      throw new BtpError(ErrorCode.TODO, 'not implemented');
    };

    return this;
  }

  off(name: string): void;
  off(name: string, listener: EventListener): void;
  off(name: string, listener?: EventListener): void {
    if (listener != null) {
      if (this.#listener !== listener) {
        throw invalidArgument('unknown listener object')
      }
    }
    assert(this.#ws != null);
    this.#ws!.close(1000);
  }

}
