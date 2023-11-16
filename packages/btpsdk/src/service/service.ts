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
  ERR_UNKNOWN_SERVICE_API,
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

export class BaseService {
  readonly provider: Provider;
  readonly name: string;
  readonly methods: { [name: string]: any };
  readonly description: ServiceDescription;
  readonly networks: Array<Network>;

  constructor(provider: Provider, description: ServiceDescription) {
    this.provider = provider;
    this.name = description.name;
    this.networks = description.networks;
    this.description = description;
    this.methods = {};

    log.debug(`new service name - name(${this.name})`);
    for (const method of description.methods) {
      log.debug(`define service method - name(${method.name})`);
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: method.readonly
          ? async (network: string, params: Map<string, any>, options?: CallOpts): Promise<any> => {
            return this.provider.call(findNetworkOrThrowError(this.networks, network), this.name, method.name, params, options ?? {});
          } : async (network: string, params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
            return this.provider.transact(findNetworkOrThrowError(this.networks, network), this.name, method.name, params, options ?? {});
          }
      });
    }

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        log.debug(`service proxy get - prop(${String(prop)})`);
        if (typeof(prop) === 'symbol' || prop in target || passProperties.indexOf(prop) >= 0) {
          return Reflect.get(target, prop, receiver);
        }
        if (prop in target.methods) {
          return target.methods[prop];
        }
        return undefined;
      },
      has: (target, prop) => {
        log.debug(`service proxy has - prop(${String(prop)})`);
        if (passProperties.indexOf(<string>prop) >= 0) {
          return Reflect.has(target, prop);
        }
        return Object.prototype.hasOwnProperty.call(target.methods, prop);
      }
    });
  }

  on(network: string, name: string, listener: EventListener): this;
  on(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
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

  once(network: string, name: string, listener: EventListener): this;
  once(network: string, name: string, filter: Map<string, any>, listener: EventListener): this;
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

  off(network: string, listener: EventListener) {
    this.provider.off('log', listener);
  }

  at(network: string): Contract {
    const target = findNetworkOrThrowError(this.networks, network);
    return new Contract(this.provider, target, this.description)
  }

  getFunction(name: string): TransactFunc | CallFunc {
    if (!Object.prototype.hasOwnProperty.call(this.methods, name)) {
      throw new BTPError(ERR_UNKNOWN_SERVICE_API, { service: this.name,  name });
    }
    return Object.getOwnPropertyDescriptor(this.methods, name)!.value;
  }
}

type TransactFunc = (params: Map<string, any>, opts: TransactOpts) => Promise<PendingTransaction>
type CallFunc = (params: Map<string, any>, opts: CallOpts) => Promise<any>


export class Service extends BaseService {
  [ name: string ]: any;
}

export class BaseContract {
  readonly provider: Provider;
  readonly network: Network;
  readonly description: ServiceDescription;
  readonly methods: { [name: string]: any } = {};

  get name(): string {
    return this.description.name;
  }

  constructor(provider: Provider, network: Network, description: ServiceDescription) {
    this.provider = provider;
    this.network = network;
    this.description = description;

    for (const method of description.methods.filter(m => m.networks.includes(network.name))) {
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: method.readonly
          ? async (params: Map<string, any>, options?: CallOpts): Promise<any> => {
            return this.provider.call(this.network, this.name, method.name, params, options ?? {});
          } : async (params: Map<string, any>, options?: TransactOpts): Promise<PendingTransaction> => {
            return this.provider.transact(this.network, this.name, method.name, params, options ?? {});
          }
      });
    }

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof(prop) === 'symbol' || prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        if (prop in target.methods) {
          return target.methods[prop];
        }
        return undefined;
      },
      has: (target, prop) => {
        if (passProperties.indexOf(<string>prop) >= 0) {
          return Reflect.has(target, prop);
        }
        return Reflect.has(target, prop);
      }
    });
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

  off(listener: EventListener) {
    this.provider.off('log', listener);
  }
}

export class Contract extends BaseContract {
  [ name: string ]: any;
}
