import { assert } from "../error/index";
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
  Listener,
} from "./types";

import { getLogger } from '../utils/log';

const log = getLogger('service');

const passProperties = [ 'then' ];

const resolver = {
  writable: (args: Array<any>): { network: string, params: { [key: string]: any }, options: TransactOpts } => {

    assert(args.length >= 1 && typeof(args[0]) === 'string');
    return {
      network: args[0],
      params: args[1],
      options: args.length > 2 ? args[2] : {}
    };
  },
  readable: (args: Array<any>): { network: string, params: { [key: string]: any }, options: CallOpts } => {
    return {
      network: args[0],
      params: args[1],
      options: args.length > 3 ? args[2] : undefined
    };
  }
}

const builder = {
  writable: function (owner: BaseService, method: string) {
    return async function (...args: Array<any>): Promise<PendingTransaction> {
      log.debug('transact arguments:', args);
      // TODO validate params
      const { network, params, options } = resolver.writable(args);
      log.debug(`resolved arguments: network(${network}) params(${params}) options(${options})`);
      return owner.provider.transact(network, owner.name, method, params, options);
    }
  },

  readable: function (owner: BaseService, method: string) {
    return async function (...args: Array<any>): Promise<any> {
      log.debug('call arguments:', args);
      const { network, params, options } = resolver.readable(args);
      log.debug(`resolved arguments: network(${network}) params(${params}) options(${options})`);
      return owner.provider.call(network, owner.name, method, params, options);
    }
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
    console.log('networks:', description.networks);
    this.methods = {};

    for (const method of description.methods) {
      Object.defineProperty(this.methods, method.name, {
        writable: false,
        enumerable: true,
        value: method.readonly ? builder.readable(this, method.name) : builder.writable(this, method.name)
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

  on(network: string, name: string, listener: Listener): this;
  on(network: string, name: string, filter: Map<string, any>, listener: Listener): this;
  on(network: string, name: string, filterOrListener: Map<string, any> | Listener, listener?: Listener): this {
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

  once(network: string, name: string, listener: Listener): this;
  once(network: string, name: string, filter: Map<string, any>, listener: Listener): this;
  once(network: string, name: string, filterOrListener: Map<string, any> | Listener, listener?: Listener): this {
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

  off(network: string, listener: Listener) {
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

    console.log('contract description:', description);
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
}

export class Contract extends BaseContract {
  [ name: string ]: any;
}
