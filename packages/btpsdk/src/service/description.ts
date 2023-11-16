import {
  assert
} from "../error/index";

export interface ServiceDescription {
  name: string;
  networks: Array<Network>;
  methods: Array<MethodDescription>;
}

export interface MethodDescription {
  name: string;
  networks: Array<string>;
  // TODO add properties for validating value
  inputs: Array<string>;
  readonly: boolean;
}

import type {
  Network,
} from "../provider/index";

import {
  getLogger,
} from "../utils/log";

const log = getLogger('service_description');

import {
  BTPError,
  ERR_UNKNOWN_SERVICE,
  ERR_INVALID_FORMAT,
} from "../error/index";

const resolver = {
  networks: {
    post: (o: any) => {
      return o['requestBody']['content']['application/json']['schema']['properties']['network']['enum'];
    },
    get: (o: any) => {
      return o['parameters'].find((parameter: any) => parameter.name === 'network')['schema']['enum'];
    }
  },
  inputs: {
    post: (o: any) => {
      const params = o['requestBody']['content']['application/json']['schema']['properties']['params']['properties'];
      return params ? Object.keys(params) : [];
    },
    get: (o: any) => {
      const params = o['parameters'].find((parameter: any) => parameter.name === 'request');
      assert(params !== undefined);
      return Object.keys(params['schema']['properties']['params']['properties'] ?? []) ?? []
    }
  }
}

function _networks(doc: any): Array<Network> {
  return doc.tags.filter((tag: any) => tag.description.startsWith('NetworkType:'))
  .map((tag: any) => {
    return /\{([^)]+)\}/.exec(tag.description)![1]
    .split(',').map(name => { return { type: tag.name, name } })
  }).flat();
}

export class OpenAPIDocument {
  #doc: any;

  static from(data: any): OpenAPIDocument {
    return new OpenAPIDocument(data);
  }

  constructor(doc: Map<string, any>) {
    this.#doc = doc;
  }

  services(names: Array<string>): Array<ServiceDescription> {
    return names.map((name) => {
      return this.service(name);
    });
  }

  service(name: string): ServiceDescription {
    log.debug(`service(${name})`);
    const prefix = `\/api\/${name}\/`;
    const regexp = new RegExp(`^${prefix}`);
    const apis = Object.entries(this.#doc['paths']);
    const targetApis = apis.filter(([_name]) => regexp.test(_name));
    if (targetApis.length <= 0) {
      throw new BTPError(ERR_UNKNOWN_SERVICE, { service: name });
    }
    const svcapi: any = Object.fromEntries(targetApis);
    const networks: Set<string> = new Set();
    const methods = Object.entries(svcapi).map(([_name, _key]: [string, any]) => {
      // assumes that an api has only either `POST` or `GET`
      assert(!(!!_key.post && !!_key.get) && (!!_key.post || !!_key.get));
      let props;
      if (_key.post) {
        props = {
          inputs: resolver.inputs.post(_key.post),
          networks: resolver.networks.post(_key.post),
          readonly: false,
        }
      } else if(_key.get) {
        props = {
          inputs: resolver.inputs.get(_key.get),
          networks: resolver.networks.get(_key.get),
          readonly: true,
        }
      } else {
        throw new BTPError(ERR_INVALID_FORMAT, { name: 'service description' })
      }
      props.networks.forEach((n: string) => networks.add(n));
      return {
        name: _name.slice(prefix.length, _name.length),
        ...props
      }
    }) ?? [];

    const dns = _networks(this.#doc);
    const ret = new Array<Network>();
    for (const n of networks) {
      ret.push(dns.find(dn => dn.name == n)!);
    }

    return {
      name,
      networks: ret,
      methods,
    }
  }
}
