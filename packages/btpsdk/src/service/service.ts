//
/**
 * @typedef {function} TransactFunc
 * @param {string} network - network name
 * @param {Map<string, any>} params
 * @param {TransactOpts} options
 * @memberof Service
 */
//
/**
 * @typedef {function} CallFunc
 * @param {string} network - network name
 * @param {Map<string, any>} params
 * @param {CallOpts} options
 * @memberof Service
 */
/**
 * @typedef {function} TransactFunc
 * @param {Map<string, any>} params
 * @param {TransactOpts} options
 * @memberof Contract
 */
//
/**
 * @typedef {function} CallFunc
 * @param {Map<string, any>} params
 * @param {CallOpts} options
 * @memberof Contract
 */

import type {
  Provider,
  PendingTransaction,
  TransactOpts,
  CallOpts,
  Network,
} from "../provider/index";

import type {
  ServiceDescription,
} from "./description";

import {
  BTPError,
  ERR_UNKNOWN_SERVICE,
} from '../error/index';

import type {
  EventListener,
} from "../provider/index";

import { getLogger } from '../utils/log';
const log = getLogger('service');

const passProperties = [ 'then' ];

function findNetworkOrThrowError(networks: Array<Network>, target: string): Network {
  return networks.find(_network => _network.name === target) ?? (() => {
    throw new BTPError(ERR_UNKNOWN_SERVICE, { name: target });
  })();
}

abstract class AbstractService<T, C> {
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

type SvcTransactFunc = (network: string, params: Map<string, any>, options?: TransactOpts) => Promise<PendingTransaction>;
type SvcCallFunc = (network: string, params: Map<string, any>, options?: CallOpts) => Promise<any>;

/**
 * Service class
 *
 * @extends {AbstractService}
 */
export class Service extends AbstractService<SvcTransactFunc, SvcCallFunc>  {
  readonly networks: Array<Network>;

  /**
   * @constructor
   * @param {Provider} provider
   * @param {ServiceDescription} desc
   */
  constructor(provider: Provider, desc: ServiceDescription) {
    super(provider, desc);
    this.networks = desc.networks;
  }

  /**
   * Returns a contract on the network
   *
   * @param {string} network - network name
   * @return {Contract}
   */
  at(network: string): Contract {
    const target = findNetworkOrThrowError(this.networks, network);
    return new Contract(this.provider, target, this.desc)
  }

  on(network: string, name: string, listener: EventListener): this;
  on(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
  /**
   * Add an event listener for the event.
   *
   * @param {string} network - network name
   * @param {string} name - event name
   * @param {Map<string, any> | EventListener} filterOrListener
   * @param {EventListener=} listener
   */
  on(network: string, name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.on('log', {
      network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  /**
   * Remove the listener from the listeners for event or remove all listeners if unspecified.
   *
   * @param {string} network - network name
   * @param {EventListener} listener
   */
  off(network: string, listener?: EventListener): this {
    if (listener != null) {
      this.provider.off('log', listener);
    } else {
      this.provider.off('log');
    }
    return this;
  }


  once(network: string, name: string, listener: EventListener): this;
  once(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
  /**
   * Add an event listener for the event, but remove the listener after it is fired once.
   *
   * @param {string} network - network name
   * @param {string} name - event name
   * @param {LogFilter | EventListener} filterOrListener
   * @param {EventListener=} listener
   */
  once(network: string, name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.once('log', {
      network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  override _makeCallFunc(svcName: string, fnName: string): SvcTransactFunc {
    return async (network: string, params: Map<string, any>, options?: CallOpts): Promise<any> => {
      return this.provider.call(findNetworkOrThrowError(this.networks, network), this.name, fnName, params, options ?? {});
    }
  }
  override _makeTransactFunc(svcName: string, fnName: string): SvcCallFunc {
    return async (network: string, params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
      return this.provider.transact(findNetworkOrThrowError(this.networks, network), this.name, fnName, params, options ?? {});
    }
  }
}

type ConTransactFunc = (params: Map<string, any>, options?: TransactOpts) => Promise<PendingTransaction>;
type ConCallFunc = (params: Map<string, any>, options?: CallOpts) => Promise<any>;

/**
 * Contract class
 *
 * @extends {AbstractService}
 */
export class Contract extends AbstractService<ConTransactFunc, ConCallFunc> {
  readonly network: Network;

  /**
   * @constructor
   * @param {Provider} provider
   * @param {Network} network
   * @param {ServiceDescription} desc
   */
  constructor(provider: Provider, network: Network, desc: ServiceDescription) {
    super(provider, desc);
    this.network = network;
  }

  _makeCallFunc(svcName: string, fnName: string): ConCallFunc {
    return async (params: Map<string, any>, options?: CallOpts): Promise<any> => {
      return this.provider.call(this.network, this.name, fnName, params, options ?? {});
    }
  }

  _makeTransactFunc(svcName: string, fnName: string): ConTransactFunc {
    return async (params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
      return this.provider.transact(this.network, this.name, fnName, params, options ?? {});
    }
  }

  on(name: string, listener: EventListener): this;
  on(name: string, filter: Map<string, any>, listener: EventListener): this;
  on(name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.on('log', {
      network: this.network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  once(name: string, listener: EventListener): this;
  once(name: string, filter: Map<string, any>, listener: EventListener): this;
  once(name: string, filterOrListener: Map<string, any> | EventListener, listener?: EventListener): this {
    let filter;
    if (filterOrListener instanceof Map) {
      filter = filterOrListener;
    } else {
      listener = filterOrListener;
    }
    this.provider.once('log', {
      network: this.network,
      service: this.name,
      event: {
        name,
        params: filter,
      }
    }, listener!);
    return this;
  }

  off(listener: EventListener): this {
    this.provider.off('log', listener);
    return this;
  }
}
