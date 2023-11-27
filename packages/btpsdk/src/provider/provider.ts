/**
 * Interface for btpsdk client
 *
 * @interface Provider
 * @memberof @iconfoundation/btpsdk
 */
/**
 * Returns all btp networks
 *
 * @function
 * @name Provider#networks
 * @async
 * @return {Array<Network>}
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
 * @return {Service}
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
 * Remove an event listener
 *
 * @function
 * @name Provider#off
 * @param {EventType} type
 * @param {EventListener} [listener]
 */
/**
 * @typedef {Object} Network
 * @property {string} name
 * @property {string} type
 * @memberof @iconfoundation/btpsdk
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
/**
 * event listener
 *
 * @callback EventListener
 * @param {Array<any>} ...args
 * @memberof @iconfoundation/btpsdk
 */

import { base64ToHex } from '../utils/index.js';
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
  formatRetransact,
} from './format.js';
import { qs } from '../utils/index.js';
import { Service } from '../service/index';

import {
  HttpProvider,
  BTPHttpProvider,
  DefaultHttpOpts,
} from './request';

import {
  BTPError,
  ServerRejectError,
  ERR_UNKNOWN_NETWORK_NAME,
  ERR_UNKNOWN_SERVICE,
} from '../error/index';

import { getLogger } from '../utils/log';
const log = getLogger('provider');


export type NetworkType = 'icon' | 'eth2' | 'bsc' | string;

export interface Network {
  name: string;
  type: NetworkType;
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
  #client: HttpProvider;
  #emitters: Map<'log' | 'block', EventEmitter<EventFilter>> = new Map();
  #finalizer: EventEmitter<EventFilter> | null = null;


  /**
   * @param {string|HttpProvider} urlOrHttpProvider
   */
  constructor(urlOrProvider: string | HttpProvider) {
    if (typeof(urlOrProvider) === 'string') {
      this.#client = new BTPHttpProvider(urlOrProvider, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      } as DefaultHttpOpts);
    } else {
      this.#client = urlOrProvider;
    }
  }

  async #services(): Promise<Array<ServiceInfo>> {
    return formatServicesInfo(await this.#client.request('/api'));
  }

  async #descriptions(): Promise<Array<ServiceDescription>> {
    return formatServiceDescs(await this.#client.request('/api-docs'), await this.#services());
  }

  #getEmitter(type: EventType): EventEmitter<EventFilter> {
    let emitter: EventEmitter<EventFilter>;
    switch (type) {
      case 'log': {
        return new LogEmitter(this.#client.baseUrl.replace('http', 'ws'));
      }
      case 'block': {
        if (this.#finalizer == null) {
          this.#finalizer = new BlockFinalityEmitter(this);
        }
        return this.#finalizer;
      }
      default:
        throw new Error("TODO");
    }
    if (!this.#emitters.has(type)) {
      this.#emitters.set(type, emitter);
    }
    return this.#emitters.get(type)!;
  }

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

    if (options.signer != null && options.from == null && options.signature == null) {
      const from = await options.signer.address(network.type);
      try {
        await this.#client.request<string>(`/api/${service}/${method}`, {
          method: 'POST',
          body: JSON.stringify({
            network: network.name,
            params,
            options: Object.assign({ ...options }, { from }),
          })
        });
      } catch (error) {
        if (!(error instanceof ServerRejectError) || error.scode != 1005) {
          throw error;
        }
        options = formatRetransact(network.type, options, error);
        const message = error.data.data;
        options.signature = await options.signer!.sign(network.type, base64ToHex(message));
      }
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
    } else {
      this.#getEmitter(type).on(type, filter as EventFilter, listener);
    }
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
    } else {
      this.#getEmitter(type).once(type, filter as EventFilter, listener);
    }
    return this;
  }

  off(type: EventType): this;
  off(type: EventType, listener: EventListener): this;
  off(type: EventType, listener?: EventListener): this {
    const emitter = this.#getEmitter(type);
    listener == null ? emitter.off(type) : emitter.off(type, listener);
    return this;
  }
}
