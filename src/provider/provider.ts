import type {
  Provider,
  EventFilter,
  Network,
  NetworkType,
  FetchOpts,
  Receipt,
  CallOpts,
  TransactOpts,
  EventType,
  Signer,
} from "./types";

import {
  PendingTransaction,
} from "./transaction";

import {
  BTPError,
  ERRORS,
} from "../utils/errors";

import {
  EventEmitter,

  isLogFilter,
  isBlockFilter,
} from "./events";

import { query } from "../utils";

import {
  FetchClient,
} from "./client";

import type {
  Listener,
  ServiceDescription,
} from "../service/types";

import {
  BaseService,
  Service
} from "../service/service";

import {
  BlockFinalityEmitter,
  LogEmitter,
} from "./events";

import { OpenAPIDocument } from "../service/description";

export class DefaultProvider implements Provider {
  #emitters: Map<'log' | 'block', EventEmitter> = new Map();
  protected fetcher: FetchClient;
  #url: string;
  readonly signer: Signer;
  constructor(url: string, signer: Signer) {
    this.#url = url;
    let opts: FetchOpts = {
      url,
    };
    this.signer = signer;
    this.fetcher = new FetchClient(opts);
  }

  #networks: Map<string, string> = new Map();

  async _serviceInfos(): Promise<Array<{ name: string, networks: Array<Network> }>> {
    const decoder = new TextDecoder();
    const resp = await this.fetcher.send({
      path: '/api',
      method: 'GET',
      headers: {},
      body: null
    });

    console.log('decoder decode:',decoder.decode(resp.body));
    const _infos: Array<{
      name: string,
      networks: {
        [name: string]: NetworkType
      }
    }> = JSON.parse(decoder.decode(resp.body));

    const infos: Array<{
      name: string,
      networks: Array<Network>
    }> = _infos.map(({ name, networks }) => {
      return {
        name,
        networks: Object.entries(networks).map(([name, type]) => {
          return { name, type }
        })
      }
    });
    return infos;
  }

  async _document(): Promise<any> {
    const resp = await this.fetcher.send({
      path: '/api-docs',
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      },
      body: null
    });
    return JSON.parse(new TextDecoder().decode(resp.body));
  }

  async networks(): Promise<Array<Network>> {
    const doc = await this._document();
    return doc.tags.filter((tag: any) => tag.description.startsWith('NetworkType:'))
      .map((tag: any) => {
        return /\{([^)]+)\}/.exec(tag.description)!![1]
          .split(',').map(name => { return { type: tag.name, name } })
      }).flat();
  }

  async services(): Promise<Array<Service>> {
    const decoder = new TextDecoder();
    const infos = await this._serviceInfos();
    const doc = OpenAPIDocument.from(await this._document());
    return doc.services(infos.map(info => info.name)).map(description => {
      const info = infos.find(({ name }) => name === description.name);
      if (info == null) {
        throw new Error("no service info");
      }
      return new Service(this, description);
    });
  }

  async service(name: string): Promise<Service> {
    const doc = OpenAPIDocument.from(await this._document());
    const description = doc.service(name);
    const infos = await this._serviceInfos();
    const info = infos.find(({ name }) => name === description.name);
    if (info == null) {
      throw new Error("no service info");
    }
    return new Service(this, description);
  }

  async transact(network: Network | string, service: string, method: string, params: { [key: string]: any }, options: TransactOpts): Promise<PendingTransaction> {
    console.log('provider transact options:', options);
    const encoder = new TextEncoder();

    if (options.from != null) {
      const resp = await this.fetcher.send({
        path: `/api/${service}/${method}`,
        method: 'POST',
        headers: {},
        body: encoder.encode(JSON.stringify({
          network: typeof(network) === 'string' ? network : network.name,
          params,
          options,
        }))
      });

      const enctx = JSON.parse(new TextDecoder().decode(resp.body));
      options.signature = await this.signer.sign('eth', enctx);
    }

    const resp = await this.fetcher.send({
      path: `/api/${service}/${method}`,
      method: 'POST',
      headers: {},
      body: encoder.encode(JSON.stringify({
        network: typeof(network) === 'string' ? network : network.name,
        params,
        options
      })),
    });

    const txid = JSON.parse(new TextDecoder().decode(resp.body));
    return new PendingTransaction(this, typeof(network) === 'string' ? {
      name: network,
      // TODO
      type: 'icon',
    } : network, txid);

  }

  // network=icon_test&params[_dst]=string
  async call(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts: CallOpts): Promise<any> {
    let qs = query.stringify({
      network: typeof(network) === 'string' ? network : network.name,
      params,
    });
    const resp = await this.fetcher.send({
      path: `/api/${service}/${method}?${qs}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
      body: null,
    });

    return JSON.parse(new TextDecoder().decode(resp.body));
  }

  async getTransactionResult(network: Network, id: string): Promise<Receipt> {
    let qs = query.stringify({ network: network.name });
    const resp = await this.fetcher.send({
      path: `/api/result/${id}?${qs}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
      body: null,
    });
    const receipt = JSON.parse(new TextDecoder().decode(resp.body));
    return {
      block: {
        id: receipt.BlockHash,
        height: receipt.BlockHeight
      }
    }
  }

  async getBlockFinality(network: string, id: string, height: number): Promise<boolean> {
    const qs = query.stringify({ network, height });
    const resp = await this.fetcher.send({
      path: `/api/finality/${id}?${qs}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
      body: null,
    });
    return JSON.parse(new TextDecoder().decode(resp.body));
  }

  on(type: 'log', filter: EventFilter, listener: Listener): this {
    this.#getEmitter(type, filter, listener).on(type, filter, listener);
    return this;
  }

  once(type: EventType, filter: EventFilter, listener: Listener): this {
    const emitter = this.#getEmitter(type, filter, listener).once(type, filter, listener);
    return this;
  }

  off(type: EventType, listener?: Listener): this {
    //this.#getEmitter(type, filter, listener).off(type, listener);
    return this;
  }

  #getEmitter(type: EventType, filter: EventFilter, listener: Listener): EventEmitter {
    let emitter: EventEmitter;
    if (!this.#emitters.has(type)) {
      switch (type) {
        case 'log': {
          emitter = new LogEmitter(this.#url.replace('http', 'ws'));
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
