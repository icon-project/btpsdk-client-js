import fetch from 'cross-fetch';
import {
  join,
  merge
} from '../utils/index';

import {
  //BTPError,
  //ERR_INVALID_FORMAT,
  ServerRejectError,
} from '../error/index';

export type DefaultOptions = Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' |
  'keepalive' | 'method' | 'mode' | 'redirect' | 'referrer' | 'referrerPolicy' | 'signal'>;

export type HttpRequestCreator = {
  baseUrl: string;
  (path: string, options?: RequestInit): Promise<Response>;
}

export interface HttpProvider {
  baseUrl: string;
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

import { getLogger } from '../utils/log';
const log = getLogger('request');

export class DefaultHttpProvider implements HttpProvider {
  #baseUrl: string | HttpRequestCreator;
  #options: DefaultOptions;

  constructor(baseUrl: string | HttpRequestCreator, options?: DefaultOptions) {
    this.#baseUrl = baseUrl;
    this.#options = options ?? {};
    log.debug(`create http provider - baseUrl(${typeof(this.#baseUrl) === 'string'
      ? this.#baseUrl : this.#baseUrl.baseUrl}) defaultOptions(${JSON.stringify(this.#options)})`);
  }

  get baseUrl() {
    return typeof(this.#baseUrl) === 'string' ? this.#baseUrl : this.#baseUrl.baseUrl;
  }


  // TODO improve error handling...
  async request<T = { [key: string]: any }>(path: string, options?: RequestInit): Promise<T> {
    log.debug(`request - path(${path}) options(${options ?? {}})`);
    const opt = (options != null ? merge(this.#options, options) : this.#options) as RequestInit;
    log.debug(`options(${JSON.stringify(opt)})`)
    const response = typeof(this.#baseUrl) === 'string' ? await fetch(join(this.#baseUrl, path), opt) : await this.#baseUrl(path, opt);
    //console.log('length:', response.headers.get('content-length'))
    if (!response.ok) {
      throw new ServerRejectError({ code: response.status, message: await response.json() })
    }

    // const contentType = response.headers.get('content-type');
    // if (contentType !== 'application/json') {
    //   throw new BTPError(ERR_INVALID_FORMAT, { name: `content type of response for \`/${path}\`` });
    // }
    return response.json();
  }
}
