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
 * Interface for http client
 *
 * @interface HttpProvider
 */
/**
 * endpoint of http(s) server
 *
 * @name HttpProvider#baseUrl
 * @type {string}
 * @readonly
 */
/**
 * @function
 * @name HttpProvider#request
 *
 * @param {string} path
 * @param {?RequestInit} options - See, {@link https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html}
 *
 * @async
 * @return {T}
 */
import fetch from 'cross-fetch';
import {
  merge
} from '../utils/index';

import {
  ServerError,
} from '../error/index';

export type DefaultHttpOpts = Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' |
  'keepalive' | 'method' | 'mode' | 'redirect' | 'referrer' | 'referrerPolicy' | 'signal'>;

export type HttpRequestCreator = {
  baseUrl: string;
  (path: string, options?: RequestInit): Promise<Response>;
}

export interface HttpProvider {
  readonly baseUrl: string;
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

import { getLogger } from '../utils/log';
const log = getLogger('request');

/**
 * Http Provider Implementation
 *
 * @implements {HttpProvider}
 */
export class BTPHttpProvider implements HttpProvider {
  #baseUrl: string | HttpRequestCreator;
  #options: DefaultHttpOpts;

  /**
   * Create BTPHttpProvider object
   *
   * @param {string} baseUrl
   * @param {?Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' | 'keepalive' | 'method' | 'mode' | 'redirect' | 'referrer' | 'referrerPolicy' | 'signal'>} options - default options for `request`
   */
  constructor(baseUrl: string | HttpRequestCreator, options?: DefaultHttpOpts) {
    this.#baseUrl = typeof(baseUrl) === 'string' && baseUrl.endsWith('/')
      ? baseUrl.slice(0, baseUrl.length) : baseUrl;
    this.#options = options ?? {};
    log.debug(`create http provider - baseUrl(${typeof(this.#baseUrl) === 'string'
      ? this.#baseUrl : this.#baseUrl.baseUrl}) defaultOptions(${JSON.stringify(this.#options)})`);
  }

  get baseUrl() {
    return typeof(this.#baseUrl) === 'string' ? this.#baseUrl : this.#baseUrl.baseUrl;
  }

  async request<T = { [key: string]: any }>(path: string, options?: RequestInit): Promise<T> {
    log.debug(`request - path(${path}) options(${JSON.stringify(options ?? {})})`);
    const url = typeof this.#baseUrl === 'string' ? this.#baseUrl : this.#baseUrl.baseUrl;
    const opt = (options != null ? merge(this.#options, options) : this.#options) as RequestInit;
    try {
      const response = typeof(this.#baseUrl) === 'string' ? await fetch(this.#baseUrl.concat(path), opt) : await this.#baseUrl(path, opt);
      if (!response.ok) {
        const res = await response.json();
        throw new ServerError({ code: res.code, message: res.message, data: res.data });
      }
      return (await response.json()) as T;
    } catch (error) {
      log.error(`fail to fetch - baseUrl(${url}) path(${path}) options(${JSON.stringify(opt)})`);
      throw error;
    }
  }
}
