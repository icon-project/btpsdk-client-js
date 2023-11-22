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
  ServerRejectError,
} from '../error/index';

export type DefaultOptions = Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' |
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
export class DefaultHttpProvider implements HttpProvider {
  #baseUrl: string | HttpRequestCreator;
  #options: DefaultOptions;

  /**
   * Create DefaultHttpProvider object
   *
   * @param {string} baseUrl
   * @param {?Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' | 'keepalive' | 'method' | 'mode' | 'redirect' | 'referrer' | 'referrerPolicy' | 'signal'>} options - default options for `request`
   */
  constructor(baseUrl: string | HttpRequestCreator, options?: DefaultOptions) {
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
    log.log(`request - path(${path}) options(${options ?? {}})`);
    const opt = (options != null ? merge(this.#options, options) : this.#options) as RequestInit;
    const response = typeof(this.#baseUrl) === 'string' ? await fetch(this.#baseUrl.concat(path), opt) : await this.#baseUrl(path, opt);
    if (!response.ok) {
      throw new ServerRejectError({ code: response.status, message: await response.json() })
    }
    return (await response.json()) as T;
  }
}
