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

export class HttpClient {
  readonly baseUrl: string;
  readonly options: DefaultOptions;

  constructor(baseUrl: string, options?: DefaultOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.options = options ?? {};
  }

  async request<T = { [ key: string ]: any }>(path: string, options?: RequestInit): Promise<T> {
    const opt = options != null ? merge(this.options, options) : this.options;
    const response = await fetch(join(this.baseUrl, path), opt);
    if (!response.ok) {
      throw new ServerRejectError({ code: response.status, message: await response.json() })
    }
    return await response.json();
  }

}
