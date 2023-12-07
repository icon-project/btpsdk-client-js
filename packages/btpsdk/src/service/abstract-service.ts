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

import type {
  Provider,
} from '../provider/index';

import type {
  ServiceDescription,
} from './description';

import { getLogger } from '../utils/log';
const log = getLogger('abstract-service');

const passProperties = [ 'then' ];

export abstract class AbstractService<T, C> {
  /**
   * @type {Provider}
   * @readonly
   */
  readonly provider: Provider;

  /**
   * service name
   * @type {string}
   * @readonly
   */
  readonly name: string;

  /**
   * service description
   * @type {ServiceDescription}
   * @readonly
   */
  readonly desc: ServiceDescription;

  /**
   * service functions
   * @readonly
   */
  readonly [ name: string ]: any;

  readonly methods: { [ name: string ]: any } ;

  constructor (provider: Provider, desc: ServiceDescription) {
    this.provider = provider;
    this.name = desc.name;
    this.desc = desc;
    this.methods = {};

    for (const method of desc.methods) {
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: method.readonly ? this._makeCallFunc(this.name, method.name) : this._makeTransactFunc(this.name, method.name)
      });
    }
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof(prop) === 'symbol' || prop in target || passProperties.indexOf(prop) >= 0) {
          return Reflect.get(target, prop, receiver);
        }
        return target.getFunction(prop);
      },

      has: (target, prop) => {
        log.debug(`service proxy has - prop(${String(prop)})`);
        if (typeof(prop) === 'symbol' || prop in target ||passProperties.indexOf(<string>prop) >= 0) {
          return Reflect.has(target, prop);
        }
        return target.hasFunction(prop);
      }
    });
  }

  /**
   * Return service function.
   * This is useful when a contract method name conflicts with a JavaScript name such as prototype or when using a Contract programatically.
   *
   * @param {string} name - function name
   * @return {TransactFunc | CallFunc}
   */
  getFunction(name: string): T | C | undefined {
    if (!this.hasFunction(name)) {
      return undefined;
    }
    return Object.getOwnPropertyDescriptor(this.methods, name)!.value;
  }

  hasFunction(name: string): boolean {
    return this.methods.hasOwnProperty(name);
  }

  abstract on(...args: Array<any>): this;
  abstract once(...args: Array<any>): this;
  abstract off(...args: Array<any>): this;

  protected abstract _makeCallFunc(svcName: string, fnName: string): C;
  protected abstract _makeTransactFunc(svcName: string, fnName: string): T;
}
