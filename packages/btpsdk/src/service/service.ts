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
 * @typedef {function} TransactFunc
 * @param {string} network - network name
 * @param {Map<string, any>} params
 * @param {TransactOpts} options
 * @memberof Service
 */
//
/**
 * @typedef {function} CallFunc
 * @param {string} network - network name
 * @param {Map<string, any>} params
 * @param {CallOpts} options
 * @memberof Service
 */

import {
  AbstractService
} from './abstract-service';

import type {
  Provider,
  PendingTransaction,
  TransactOpts,
  CallOpts,
  Network,
} from "../provider/index";

import type {
  ServiceDescription,
} from "./description";

import {
  Contract
} from './contract';

import {
  invalidArgument,
} from '../error/index';

import type {
  EventListener,
} from "../provider/index";

import { getLogger } from '../utils/log';
const log = getLogger('service');

function findNetworkOrThrowError(networks: Array<Network>, target: string): Network {
  return networks.find(_network => _network.name === target) ?? (() => {
    throw invalidArgument(`unknown service(${target})`);
  })();
}

type SvcTransactFunc = (network: string, params: Map<string, any>, options?: TransactOpts) => Promise<PendingTransaction>;
type SvcCallFunc = (network: string, params: Map<string, any>, options?: CallOpts) => Promise<any>;

/**
 * Service class
 *
 * @extends {AbstractService}
 */
export class Service extends AbstractService<SvcTransactFunc, SvcCallFunc>  {
  readonly networks: Array<Network>;

  /**
   * @constructor
   * @param {Provider} provider
   * @param {ServiceDescription} desc
   */
  constructor(provider: Provider, desc: ServiceDescription) {
    super(provider, desc);
    this.networks = desc.networks;
    log.debug(`create service - name(${this.name}) networks(${this.networks.map(n => n.name).join(', ')}`);
  }

  /**
   * Returns a contract on the network
   *
   * @param {string} network - network name
   * @return {Contract}
   */
  at(network: string): Contract {
    const target = findNetworkOrThrowError(this.networks, network);
    return new Contract(this.provider, this.desc, target)
  }

  on(network: string, name: string, listener: EventListener): this;
  on(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
  /**
   * Add an event listener for the event.
   *
   * @param {string} network - network name
   * @param {string} name - event name
   * @param {Map<string, any> | EventListener} filterOrListener
   * @param {EventListener=} listener
   */
  on(network: string, name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.on('log', {
      network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  /**
   * Remove the listener from the listeners for event or remove all listeners if unspecified.
   *
   * @param {string} network - network name
   * @param {EventListener} listener
   */
  off(network: string, listener?: EventListener): this {
    if (listener != null) {
      this.provider.off('log', listener);
    } else {
      this.provider.off('log');
    }
    return this;
  }


  once(network: string, name: string, listener: EventListener): this;
  once(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
  /**
   * Add an event listener for the event, but remove the listener after it is fired once.
   *
   * @param {string} network - network name
   * @param {string} name - event name
   * @param {LogFilter | EventListener} filterOrListener
   * @param {EventListener=} listener
   */
  once(network: string, name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.once('log', {
      network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  override _makeCallFunc(svcName: string, fnName: string): SvcTransactFunc {
    return async (network: string, params: Map<string, any>, options?: CallOpts): Promise<any> => {
      return this.provider.call(findNetworkOrThrowError(this.networks, network), this.name, fnName, params, options ?? {});
    }
  }
  override _makeTransactFunc(svcName: string, fnName: string): SvcCallFunc {
    return async (network: string, params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
      return this.provider.transact(findNetworkOrThrowError(this.networks, network), this.name, fnName, params, options ?? {});
    }
  }
}
