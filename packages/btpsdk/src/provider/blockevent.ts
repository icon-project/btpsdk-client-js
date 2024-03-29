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

import {
  assert,
  BtpError,
  ErrorCode,
} from "../error/index";

import type { Network } from './provider';

import {
  Provider,
} from './provider';

import {
  EventListener,
  EventEmitter,
} from './index';

import {
  getLogger
} from '../utils/log';

interface PoolItem {
  id: string;
  height: number;
  listeners: Array<EventListener>;
}

type Timer = ReturnType<typeof setTimeout>;

const log = getLogger('blockevent');

export interface BlockFilter {
  network: Network;
  status: 'finalized',
  id: string;
  height: number;
}

export class BlockFinalityEmitter implements EventEmitter<BlockFilter> {
  #provider: Provider;
  #pools: Map<string, Array<PoolItem>> = new Map();
  #timers: Map<string, Timer | null> = new Map();
  #interval: number;

  constructor(provider: Provider, opts: { interval: number } = { interval: 1000 }) {
    this.#provider = provider;
    this.#interval = opts.interval;
  }

  on(name: string, filter: any, listener: EventListener): this {
    throw new BtpError(ErrorCode.UnsupportedOperation);
  }

  once(name: string, filter: BlockFilter, listener: EventListener): this {
    log.debug(`once(${name}, ${JSON.stringify(filter)})`);
    const network = typeof(filter.network) === 'string'
      ? filter.network
      : filter.network.name

    if (!this.#pools.has(network)) {
      this.#pools.set(network, []);
    }

    const pool = this.#pools.get(network)!;
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
      this.#timers.set(network, null);
      this.#start(network).catch(error => {
        // TODO notify error
      });
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
    if (!this.#timers.has(network)) {
      return;
    }

    const pool = this.#pools.get(network);
    if (pool == null || pool.length == 0) {
      log.info(`no available event target - target netowrk(${network})`);
      this.#stop(network);
      return;
    }
    const item = pool.at(0)!;
    let finality = false;
    let error: undefined | BtpError = undefined;
    try {
      finality = await this.#provider.getBlockFinality(network, item.id, item.height);
    } catch (err) {
      assert((<BtpError>err).code === ErrorCode.InconsistentBlock, 'TODO: handle error' + err);
      finality = true;
      if (err instanceof BtpError) {
        error = err;
      }
    } finally {
      if (finality) {
        for (const listener of item.listeners) {
          log.debug(`emit block finality event - network(${network}) block(${item.height}:${item.id})`);
          listener(error);
        }
        pool.shift();
      }
    }

    if (this.#timers.has(network)) {
      this.#timers.set(network, setTimeout(this.#start.bind(this, network), !finality ? this.#interval : 0));
    }

  }

  #stop(network: string) {
    log.debug(`try to stop block event emitter - network${network}`);
    const timer = this.#timers.get(network);
    if (timer !== undefined) {
      if (timer !== null) {
        clearTimeout(timer);
      }
      this.#timers.delete(network);
    } else {
      log.debug('no stoppable timer');
    }
  }

  #pause(network: string, handler: () => void) {
    log.debug(`pause(${network})`);
    if (this.#timers.has(network)) {
      this.#stop(network);
      handler();
      this.#timers.set(network, null);
      this.#start(network);
    } else {
      handler();
    }
  }
}
