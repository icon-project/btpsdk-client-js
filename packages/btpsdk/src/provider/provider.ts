/**
 * Interface for btpsdk client
 *
 * @interface Provider
 * @memberof @iconfoundation/btpsdk
 */
/**
 * Returns available btp services
 *
 * @function
 * @name Provider#services
 * @async
 * @returns {Array<Service>}
 */
/**
 * Returns btp service
 *
 * @function
 * @name Provider#service
 * @param {string} service name
 * @async
 * @return {Promise<Service>}
 * @throws {ERR_UNKNOWN_SERVICE}
 */
/**
 * Send service transaction
 *
 * @function
 * @name Provider#transact
 * @param {string|Network} network
 * @param {string} service
 * @param {string} method
 * @param {Map<string, any>}
 * @param {TransactOpts}
 *
 * @async
 * @return {PendingTransaction}
 *
 */
/**
 * Call service method
 *
 * @function
 * @name Provider#call
 * @param {string|Network} network
 * @param {string} service
 * @param {string} method
 * @param {Map<string, any>}
 * @param {CallOpts}
 *
 * @async
 * @return {Object}
 */
/**
 * Returns receipt for the transaction
 *
 * @function
 * @name Provider#getTransactionResult
 * @param {Network}
 * @param {string} id - transaction id
 *
 * @async
 * @return {Receipt}
 */
/**
 * Returns finality of the block on network
 *
 * @function
 * @name Provider#getBlockFinality
 * @param {string} network
 * @param {string} block id
 * @param {number} block height
 *
 * @async
 * @return {boolean}
 */
/**
 * Add an event listener for the event.
 *
 * @function
 * @name Provider#on
 * @param {string} type - event type
 * @param {ProviderFilter} filter
 * @param {EventListener} listener
 * @return {this}
 */
/**
 * Add an event listener for the event, but remove the listener after it is fired once.
 *
 * @function
 * @name Provider#once
 *
 * @param {string} type - event type
 * @param {ProviderFilter} filter
 * @param {EventListener} listener
 */
/**
 * @typedef {Object} Network
 * @property {string} name
 * @property {string} type
 */
/**
 * @typedef {ProviderLogFilter|ProviderBlockFilter} ProviderFilter
 * @memberof @iconfoundation/btpsdk
 */
/**
 * @typedef {Object} ProviderLogFilter
 * @property {string|Network} network - network name or network object
 * @property {string} service - service name
 * @memberof @iconfoundation/btpsdk
 */
/**
 * @typedef {Object} ProviderBlockFilter
 * @property {string|Network} network - network name or network object
 * @property {string} status
 * @property {string} id - block id
 * @property {number} height - block height
 * @memberof @iconfoundation/btpsdk
 */

import type { ServiceDescription } from '../service/index.js';
import type {
  Receipt,
  CallOpts,
  TransactOpts,
} from './transaction.js';

import {
  LogEmitter,
  LogFilter,
} from './eventlog';

import {
  BlockFilter,
  BlockFinalityEmitter,
} from './blockevent';

import { PendingTransaction } from './transaction.js';
import {
  formatServiceDescs,
  formatServicesInfo,
  formatNetworks,
  formatReceipt,
  formatTransactOpts,
} from './format.js';
import { qs } from '../utils/index.js';
import { Service } from '../service/index';

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

import { merge } from '../utils/index';
import { getLogger } from '../utils/log';
const log = getLogger('provider');


export type NetworkType = 'icon' | 'eth2' | 'bsc';

export interface Network {
  name: string;
  type: NetworkType;
}

export interface ServiceDesc {
  name: string;
  networks: Array<Network>;
  methods: Array<MethodDesc>;
}

export interface MethodDesc {
  name: string;
  networks: Array<string>;
  inputs: Array<string>;
  readonly: boolean;
}

export interface ServiceInfo {
  name: string;
  networks: Array<Network>;
}

export type EventListener = (...args: Array<any>) => void;

export type EventType = 'log' | 'block';

export type EventFilter = LogFilter | BlockFilter;

export type ProviderFilter = ProviderLogFilter | ProviderBlockFilter;
export interface ProviderLogFilter {
  network: string | Network;
  service: string;
  event: {
    name: string;
    params?: Map<string, any> | Array<Map<string, any>>;
  }
}

export interface ProviderBlockFilter {
  network: string | Network;
  status: 'finalized',
  id: string;
  height: number;
}

export interface EventEmitter<T> {
  on(name: string, filter: T, listener: EventListener): this;
  once(name: string, filter: T, listener: EventListener): this;
  off(name: string): void;
  off(name: string, listener: EventListener): void;
}

export interface Provider extends EventEmitter<ProviderFilter> {
  networks(): Promise<Array<Network>>;
  services(): Promise<Array<Service>>;
  service(nameOrDesc: string | ServiceDescription): Promise<Service>;
  transact(network: Network | string, service: string, method: string, params: Map<string, any>, opts?: TransactOpts): Promise<PendingTransaction>;
  call(network: Network | string, service: string, method: string, params: Map<string, any>, opts: CallOpts): Promise<any>;
  getTransactionResult(network: Network, id: string): Promise<Receipt>;
  getBlockFinality(network: string, id: string, height: number): Promise<boolean>;
}

/**
 * BTPProvider
 *
 * @implements {Provider}
 * @memberof @iconfoundation/btpsdk
 */
export class BTPProvider implements Provider {
  #baseUrl: string;
  #transactOpts: TransactOpts;
  #client: HttpProvider;
  #emitters: Map<'log' | 'block', EventEmitter<EventFilter>> = new Map();

  /**
   * @param {string} baseUrl
   * @param {BTPProviderOptions} options
   */
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
    }) as DefaultOptions);
  }

  async #services(): Promise<Array<ServiceInfo>> {
    return formatServicesInfo(await this.#client.request('/api'));
  }

  async #descriptions(): Promise<Array<ServiceDesc>> {
    return formatServiceDescs(await this.#client.request('/api-docs'), await this.#services());
  }

  /**
   * Returns all btp networks
   *
   * @return {Promise<Array<Network>>}
   */
  async networks(): Promise<Array<Network>> {
    return formatNetworks(await this.#client.request('/api'));
  }

  async services(): Promise<Array<Service>> {
    return (await this.#descriptions()).map(desc => new Service(this, desc));
  }

  async service(name: string): Promise<Service> {
    const desc = (await this.#descriptions()).find(desc => desc.name === name);
    return new Service(this, desc ?? (() => { throw new BTPError(ERR_UNKNOWN_SERVICE, { name }) })());
  }

  async transact(network: string | Network, service: string, method: string, params: Map<string, any>, options: TransactOpts): Promise<PendingTransaction> {
    if (typeof(network) == 'string') {
      network = ((await this.#services()).find(info => info.name === service) ??
        (() => { throw new BTPError(ERR_UNKNOWN_SERVICE, { service }); })()).networks.find(net => net.name === network) ??
        (() => { throw new BTPError(ERR_UNKNOWN_NETWORK_NAME, { name: network }); })();
      log.debug('conv network name to network instance:', network);
    }

    if (!!options.from != !!options.signature) {
      throw new Error('both `from` and `signautre` must be null or have values');
    }

    const signer = options.signer || this.#transactOpts?.signer;
    if (signer != null && options.from == null && options.signature == null) {
      const from = await signer.address(network.type);
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
      options.signature = await signer.sign(network.type, rawtx);
    }

    const response = await this.#client.request<string>(`/api/${service}/${method}`, {
      method: 'POST',
      body: JSON.stringify({
        network: network.name,
        params,
        options: formatTransactOpts(network.type, options)
      }),
    });

    const txid = response;
    return new PendingTransaction(this, network, txid);
  }

  async call(network: Network | string, service: string, method: string, params: Map<string, any>, options: CallOpts): Promise<any> {
    if (typeof(network) == 'string') {
      network = ((await this.#services()).find(info => info.name === service) ??
        (() => { throw new BTPError(ERR_UNKNOWN_SERVICE, { service }); })()).networks.find(net => net.name === network) ??
        (() => { throw new BTPError(ERR_UNKNOWN_NETWORK_NAME, { name: network }); })();
      log.debug('conv network name to network instance:', network);
    }

    const query = qs({
      network: network.name,
      params,
      options: options,
    });
    return await this.#client.request<any>(`/api/${service}/${method}?${query}`);
  }

  async getTransactionResult(network: Network, id: string): Promise<Receipt> {
    const query = qs({ network: network.name });
    const response = await this.#client.request(`/api/result/${id}?${query}`);
    return formatReceipt(network.type, response);
  }

  async getBlockFinality(network: string, id: string, height: number): Promise<boolean> {
    const query = qs({ network, height });
    return await this.#client.request<boolean>(`/api/finality/${id}?${query}`);
  }

  async #network(name: string): Promise<Network> {
    return (await this.networks()).find(network => network.name  === name)
      ?? (() => {
        throw new BTPError(ERR_UNKNOWN_NETWORK_NAME, { name });
      })();
  }

  on(type: 'log', filter: ProviderFilter, listener: EventListener): this {
    if (typeof(filter.network) == 'string') {
      this.#network(filter.network)
        .then((network) => {
          filter.network = network;
          this.#getEmitter(type).on(type, filter as EventFilter, listener);
        })
        .catch((error) => {
          listener(error);
        });
    }
    this.#getEmitter(type).on(type, filter as EventFilter, listener);
    return this;
  }

  once(type: EventType, filter: ProviderFilter, listener: EventListener): this {
    if (typeof(filter.network) == 'string') {
      this.#network(filter.network)
        .then((network) => {
          filter.network = network;
          this.#getEmitter(type).on(type, filter as EventFilter, listener);
        })
        .catch((error) => {
          listener(error);
        });
    }
    this.#getEmitter(type).once(type, filter as EventFilter, listener);
    return this;
  }

  /**
   * Unregister event listener
   *
   * @param {EventType} type
   * @param {EventListener} [listener]
   */
  off(type: EventType): this;
  off(type: EventType, listener: EventListener): this;
  off(type: EventType, listener?: EventListener): this {
    const emitter = this.#getEmitter(type);
    listener == null ? emitter.off(type) : emitter.off(type, listener);
    return this;
  }

  #getEmitter(type: EventType): EventEmitter<EventFilter> {
    let emitter: EventEmitter<EventFilter>;
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
    return this.#emitters.get(type)!;
  }
}
