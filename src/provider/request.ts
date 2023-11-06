import fetch from 'cross-fetch';
import {
  join,
  merge
} from '../utils/index';

import {
  ServerRejectError
} from '../error/index';

export type DefaultOptions = Pick<RequestInit, 'cache' | 'credentials' | 'headers' | 'integrity' |
  'keepalive' | 'method' | 'mode' | 'redirect' | 'referrer' | 'referrerPolicy' | 'signal'>;

export type HttpRequestCreator = {
  baseUrl: string;
  (path: string, options?: RequestInit): Response;
}

export interface HttpProvider {
  baseUrl: string;
  request<T>(path: string, options?: RequestInit): Promise<T>;
}

export class DefaultHttpProvider implements HttpProvider {
  #baseUrl: string | HttpRequestCreator;
  readonly options: DefaultOptions;

  constructor(baseUrl: string | HttpRequestCreator, options?: DefaultOptions) {
    this.#baseUrl = baseUrl;
    this.options = options ?? {};
  }

  get baseUrl() {
    return typeof(this.#baseUrl) === 'string' ? this.#baseUrl : this.#baseUrl.baseUrl;
  }


  async request<T = { [key: string]: any }>(path: string, options?: RequestInit): Promise<T> {
    const opt = options != null ? merge(this.options, options) : this.options;
    const response = typeof(this.#baseUrl) === 'string' ? await fetch(join(this.#baseUrl, path), opt) : await this.#baseUrl(path, opt);
    if (!response.ok) {
      throw new ServerRejectError({ code: response.status, message: await response.json() })
    }
    return response.json();
  }
}
