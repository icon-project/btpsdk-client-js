import type {
  Provider,
  Network,
  NetworkType,
  Receipt,
  CallOpts,
  TransactOpts,
  EventType,
} from "./types";

import {
  EventListener,
  EventEmitter,
  EventFilter,
  BlockFinalityEmitter,
  LogEmitter,
} from './event/index';

import {
  PendingTransaction,
} from "./transaction";

import { qs } from "../utils/index";

import { formatReceipt } from './formatter';

import {
  Service
} from "../service/service";

import {
  HttpProvider,
  DefaultHttpProvider,
  DefaultOptions,
  HttpRequestCreator,
} from './request';

import {
  BTPError,
  ERR_UNKNOWN_NETWORK_NAME,
  ERR_UNKNOWN_SERVICE,
} from '../error/index';

export interface FetchOptions {
  cache: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached"
  credentials: "omit" | "same-origin" | "include";
  headers: Record<string, string>;
  integrity: string;
  keepalive: boolean;
  method: string;
  mode: "navigate" | "same-origin" | "no-cors" | "cors";
  redirect: "follow" | "error" | "manual";
}

import { OpenAPIDocument } from "../service/description";
import { merge } from '../utils/index';

import { getLogger } from '../utils/log';

let log = getLogger('provider');

export class BTPProvider implements Provider {
  #baseUrl: string;
  #transactOpts: TransactOpts;
  #client: HttpProvider;
  #emitters: Map<'log' | 'block', EventEmitter> = new Map();

  constructor(creator: HttpRequestCreator, options?: TransactOpts & DefaultOptions);
  constructor(baseUrl: string, options?: TransactOpts & DefaultOptions);
  constructor(baseUrlOrCreator: string | HttpRequestCreator, options?: TransactOpts & DefaultOptions) {
    this.#baseUrl = typeof(baseUrlOrCreator) === 'string' ? baseUrlOrCreator : baseUrlOrCreator.baseUrl;
    this.#transactOpts = options ?? {};
    this.#client = new DefaultHttpProvider(baseUrlOrCreator, merge(options ?? {}, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }));
    log = getLogger('provider');
    log.info('haha');
  }

  async #services(): Promise<Array<{ name: string, networks: Array<Network> }>> {
    const response = await this.#client.request<Array<{
      name: string,
      networks: {
        [name: string]: NetworkType
      }
    }>>('/api');

    const infos: Array<{
      name: string,
      networks: Array<Network>
    }> = response.map(({ name, networks }) => {
      return {
        name,
        networks: Object.entries(networks).map(([name, type]) => {
          return { name, type }
        })
      }
    });
    return infos;
  }

  async #document(): Promise<any> {
    return await this.#client.request('/api-docs');
  }

  async networks(): Promise<Array<Network>> {
    const doc = await this.#document();
    return doc.tags.filter((tag: any) => tag.description.startsWith('NetworkType:'))
      .map((tag: any) => {
        return /\{([^)]+)\}/.exec(tag.description)!![1]
          .split(',').map(name => { return { type: tag.name, name } })
      }).flat();
  }

  async services(): Promise<Array<Service>> {
    const infos = await this.#services();
    const doc = OpenAPIDocument.from(await this.#document());
    return doc.services(infos.map(info => info.name)).map(description => {
      const info = infos.find(({ name }) => name === description.name);
      if (info == null) {
        throw new Error("no service info");
      }
      return new Service(this, description);
    });
  }

  async service(name: string): Promise<Service> {
    const doc = OpenAPIDocument.from(await this.#document());
    const description = doc.service(name);
    const infos = await this.#services();
    const info = infos.find(({ name }) => name === description.name);
    if (info == null) {
      throw new Error("no service info");
    }
    return new Service(this, description);
  }

  async transact(network: string | Network, service: string, method: string, params: { [key: string]: any }, options: TransactOpts): Promise<PendingTransaction> {
    if (typeof(network) == 'string') {
      network = ((await this.#services()).find(info => info.name === service) ??
        (() => { throw new BTPError(ERR_UNKNOWN_SERVICE, { service }); })()).networks.find(net => net.name === network) ??
        (() => { throw new BTPError(ERR_UNKNOWN_NETWORK_NAME, { name: network }); })();
      log.debug('conv network name to network instance:', network);
    }

    console.log(`provider::transact{ ${network}, ${service}, ${method}, ${params}, ${options} }`);
    if (!!options.from != !!options.signature) {
      throw new Error('both `from` and `signautre` must be null or have values');
    }

    const signer = options.signer || this.#transactOpts?.signer;
    if (signer != null && options.from == null && options.signature == null) {
      const from = await signer!.address(network.type);
      const response = await this.#client.request<string>(`/api/${service}/${method}`, {
        method: 'POST',
        body: JSON.stringify({
          network: network.name,
          params,
          options: Object.assign({ ...options }, { from }),
        })
      });

      const rawtx = response;
      options.from = from;
      options.signature = await signer!.sign(network.type, rawtx);
    }

    const response = await this.#client.request<string>(`/api/${service}/${method}`, {
      method: 'POST',
      body: JSON.stringify({
        network: network.name,
        params,
        options
      }),
    });

    const txid = response;
    return new PendingTransaction(this, network, txid);
  }

  // network=icon_test&params[_dst]=string
  async call<T = any>(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts: CallOpts): Promise<any> {
    if (typeof(network) == 'string') {
      network = ((await this.#services()).find(info => info.name === service) ??
        (() => { throw new BTPError(ERR_UNKNOWN_SERVICE, { service }); })()).networks.find(net => net.name === network) ??
        (() => { throw new BTPError(ERR_UNKNOWN_NETWORK_NAME, { name: network }); })();
      log.debug('conv network name to network instance:', network);
    }

    let query = qs({
      network: (network as Network).name,
      params,
    });
    console.log('query:', query);
    return await this.#client.request<T>(`/api/${service}/${method}?${query}`);
  }

  async getTransactionResult(network: Network, id: string): Promise<Receipt> {
    console.debug('provider::getTransactionResult', network, id);
    let query = qs({ network: network.name });
    const response = await this.#client.request(`/api/result/${id}?${query}`);
    return formatReceipt(network.type, response);
  }

  async getBlockFinality(network: string, id: string, height: number): Promise<boolean> {
    console.log(`get block finality: ${network} ${id} ${height}`);
    const query = qs({ network, height });
    return await this.#client.request<boolean>(`/api/finality/${id}?${query}`);
  }

  on(type: 'log', filter: EventFilter, listener: EventListener): this {
    this.#getEmitter(type).on(type, filter, listener);
    return this;
  }

  once(type: EventType, filter: EventFilter, listener: EventListener): this {
    this.#getEmitter(type).once(type, filter, listener);
    return this;
  }

  off(type: EventType): this;
  off(type: EventType, listener: EventListener): this;
  off(type: EventType, listener?: EventListener): this {
    const emitter = this.#getEmitter(type);
    listener == null ? emitter.off(type) : emitter.off(type, listener);
    return this;
  }

  #getEmitter(type: EventType): EventEmitter {
    let emitter: EventEmitter;
    if (!this.#emitters.has(type)) {
      switch (type) {
        case 'log': {
          emitter = new LogEmitter(this.#baseUrl.replace('http', 'ws'));
          break
        }
        case 'block': {
          emitter = new BlockFinalityEmitter(this);
          break
        }
        default:
          throw new Error("");
      }
      this.#emitters.set(type, emitter);
    }
    return this.#emitters.get(type)!!;
  }
}
