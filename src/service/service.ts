import type {
  Provider,
  PendingTransaction,
  TransactOpts,
  CallOpts,
  Network,
} from "../provider/types";
import type {
  ServiceDescription,
} from "./types";

import type {
  EventListener,
} from "../provider/event/index";

// import { getLogger } from '../utils/log';
// const log = getLogger('service');

const passProperties = [ 'then' ];

function resolveCallArgs(args: Array<any>): { network: string, params: { [key: string]: any }, options: CallOpts } {
  return {
    network: args[0],
    params: args[1],
    options: args.length > 2 ? args[2] : undefined
  }
}

function resolveTransactArgs(args: Array<any>): { network: string, params: { [key: string]: any }, options: TransactOpts } {
  return {
    network: args[0],
    params: args[1],
    options: args.length > 2 ? args[2] : {}
  }
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

    for (const method of description.methods) {
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: !method.readonly ? async (...args: Array<any>): Promise<any> => {
          const { network, params, options } = resolveTransactArgs(args);
          return this.provider.transact(network, this.name, method.name, params, options);
        } : async (...args: Array<any>): Promise<PendingTransaction> => {
          const { network, params, options } = resolveCallArgs(args);
          return this.provider.call(network, this.name, method.name, params, options);
        }
      });
    }

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof(prop) === 'symbol' || prop in target || passProperties.indexOf(prop) >= 0) {
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
    }, listener!!);
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
    }, listener!!);
    return this;
  }

  off(network: string, listener: EventListener) {
    this.provider.off('log', listener);
  }

  at(network: string): Promise<Contract> {
    return new Promise((resolve, reject) => {
      if (this.networks.find(n => n.name == network) != null) {
        resolve(new Contract(this.provider, network, this.description));
      } else {
        reject(new Error(`no contract on the network - network(${network})`));
      }
    });
  }
}

export class Service extends BaseService {
  [ name: string ]: any;
}

export class BaseContract {
  readonly provider: Provider;
  readonly network: string;
  readonly description: ServiceDescription;
  readonly methods: { [name: string]: any } = {};

  get name(): string {
    return this.description.name;
  }

  constructor(provider: Provider, network: string, description: ServiceDescription) {
    this.provider = provider;
    this.network = network;
    this.description = description;

    for (const method of description.methods.filter(m => m.networks.includes(network))) {
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: method.readonly
          ? ((provider: Provider, name: string) => {
              return async (...args: Array<any>): Promise<any> => {
                const params = args[0];
                const options = args.length > 0 ? args[1] : undefined;
                return provider.call(this.network, name, method.name, params, options);
              }
            })(this.provider, method.name)
          : ((provider: Provider, name: string) => {
            return async (...args: Array<any>): Promise<any> => {
                const params = args[0];
                const options = args.length > 0 ? args[1] : undefined;
                return provider.transact(this.network, name, method.name, params, options);
            }
          })(this.provider, this.name)
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
    }, listener!!);
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
    }, listener!!);
    return this;
  }

  off(listener: EventListener) {
    this.provider.off('log', listener);
  }
}

export class Contract extends BaseContract {
  [ name: string ]: any;
}
