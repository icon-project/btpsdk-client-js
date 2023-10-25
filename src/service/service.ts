import { assert } from "../utils/errors";
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

const passProperties = [ 'then' ];

const resolver = {
  writable: (args: Array<any>): { network: string, params: { [key: string]: any }, options: TransactOpts } => {

    assert(args.length >= 1 && typeof(args[0]) === 'string');
    return {
      network: args[0],
      params: args[1],
      options: args.length > 2 ? args[2] : undefined
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
      console.log('transact args:', args);
      // TODO validate params
      const { network, params, options } = resolver.writable(args);
      console.log(`transact network: ${network} params: ${params} options: ${options}`);
      return owner.provider.transact(network, owner.name, method, params, options);
    }
  },

  readable: function (owner: BaseService, method: string) {
    return async function (...args: Array<any>): Promise<any> {
      const { network, params, options } = resolver.readable(args);
      console.log(`call network: ${network} params: ${params} options: ${options}`);
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

export class Contract {
  readonly provider: Provider;
  readonly network: string;
  readonly description: ServiceDescription;

  constructor(provider: Provider, network: string, description: ServiceDescription) {
    this.provider = provider;
    this.network = network;
    this.description = description;

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof(prop) === 'symbol' || prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        return target.description.methods.find((m) => m.name === prop);
      },

      has: (target, prop) => {
        return true;
      }
    });
  }
}
