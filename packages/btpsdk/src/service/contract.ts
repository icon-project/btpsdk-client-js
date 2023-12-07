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
 * @param {Map<string, any>} params
 * @param {TransactOpts} options
 * @memberof Contract
 */
//
/**
 * @typedef {function} CallFunc
 * @param {Map<string, any>} params
 * @param {CallOpts} options
 * @memberof Contract
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

import { getLogger } from '../utils/log';
const log = getLogger('contract');

type ConTransactFunc = (params: Map<string, any>, options?: TransactOpts) => Promise<PendingTransaction>;
type ConCallFunc = (params: Map<string, any>, options?: CallOpts) => Promise<any>;

/**
 * Contract class
 *
 * @extends {AbstractService}
 */
export class Contract extends AbstractService<ConTransactFunc, ConCallFunc> {
  readonly network: Network;

  /**
   * @constructor
   * @param {Provider} provider
   * @param {ServiceDescription} desc
   * @param {Network} network
   */
  constructor(provider: Provider, desc: ServiceDescription, network: Network) {
    super(provider, desc);
    this.network = network;
    log.debug(`create contract - name(${this.name}) network(${JSON.stringify(this.network)}`);
  }

  _makeCallFunc(svcName: string, fnName: string): ConCallFunc {
    return async (params: Map<string, any>, options?: CallOpts): Promise<any> => {
      return this.provider.call(this.network, this.name, fnName, params, options ?? {});
    }
  }

  _makeTransactFunc(svcName: string, fnName: string): ConTransactFunc {
    return async (params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
      return this.provider.transact(this.network, this.name, fnName, params, options ?? {});
    }
  }

  on(name: string, listener: EventListener): this;
  on(name: string, filter: Map<string, any>, listener: EventListener): this;
  on(name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.on('log', {
      network: this.network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  once(name: string, listener: EventListener): this;
  once(name: string, filter: Map<string, any>, listener: EventListener): this;
  once(name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.once('log', {
      network: this.network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  off(listener: EventListener): this {
    this.provider.off('log', listener);
    return this;
  }
}
