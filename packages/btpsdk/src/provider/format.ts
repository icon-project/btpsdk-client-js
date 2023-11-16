import type {
  Network,
  NetworkType,
  ServiceInfo,
  ServiceDesc,
} from './provider';

import {
  BTPError,
  ERR_INVALID_FORMAT,
} from '../error/index';

import { getLogger } from '../utils/log';
const log = getLogger('format');

function checkType (condition: boolean): asserts condition {
  if (!condition) throw new BTPError(ERR_INVALID_FORMAT);
}

// format response of `/api`
export function formatServicesInfo (value: any): Array<ServiceInfo> {
  checkType(typeof(value) === 'object');
  checkType(typeof(value.name) === 'string');
  checkType(typeof(value.networks) === 'object');

  return value.map(({ name, networks }: {
    name: string,
    networks: Array<{
      [name: string]: NetworkType
    }> }) => {
    return {
      name,
      networks: Object.entries(networks).map(([ name, type ]) => {
        return { name, type };
      })
    };
  }) as Array<ServiceInfo>;
}

// format response of `/api`
export function formatNetworks (value: any): Array<Network> {
  checkType(typeof(value) === 'object');
  checkType(typeof(value.name) === 'string');
  checkType(typeof(value.networks) === 'object');

  return Object.entries(value.map(({ networks }: {
    networks: Array<{
      [name: string]: NetworkType
    }> }) => networks)
    .reduce(
      (
        acc: { [name: string]: NetworkType },
        cur: { [name: string]: NetworkType }) => Object.assign(acc, cur)
    ))
    .map(([ name, type ]) => {
      return { name, type: type as NetworkType };
    });
}

// format response of `/api-docs`
export function formatServiceDescs (value: any, infos: Array<ServiceInfo>): Array<ServiceDesc> {
  checkType(typeof(value) === 'object');
  checkType(typeof(value.paths) === 'object');

  return infos.map(info => {
    const prefix = `\/api\/${info.name}\/`;
    const regexp = new RegExp(`^${prefix}`);

    const paths = Object.entries(value['paths']);
    const apis = paths.filter(([name]) => regexp.test(name));

    return {
      name: info.name,
      networks: info.networks,
      methods: apis.length <= 0 ? [] : apis.map(([ name, desc ]: [ string, any ]) => {
        if (desc.post != null) {
          return {
            inputs: _formatWritableMethodInputs(desc.post),
            networks: _formatWritableMethodSupportedNetworks(desc.post),
            readonly: false
          }
        } else if (desc.get != null) {
          return {
            inputs: _formatReadableMethodInputs(desc.get),
            networks: _formatReadableSupportedNewtorks(desc.get),
            readonly: true
          }
        } else {
          throw new Error('unknown service method property');
        }
      })
    } as ServiceDesc;
  });
}

function _formatWritableMethodInputs (value: any) {
  let inputs;
  try {
    inputs = value['requestBody']['content']['application/json']['schema']['properties']['params']['properties'];
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BTPError(ERR_INVALID_FORMAT, { name: 'api desc' });
    }
    throw error;
  }
  return inputs != null ? Object.keys(inputs) : [];
}

function _formatWritableMethodSupportedNetworks (value: any) {
  try {
    return value['requestBody']['content']['application/json']['schema']['properties']['network']['enum'];
  } catch (error) {
    log.debug('fail to parsing supporting networks of writable method:', error);
    if (error instanceof TypeError) {
      throw new BTPError(ERR_INVALID_FORMAT, { name: 'api desc' });
    }
    throw error;
  }
}

function _formatReadableMethodInputs (value: any) {
  checkType(typeof(value) === 'object');
  checkType(Array.isArray(value.parameters));
  try {
    return Object.keys(
      value.find((p: any) => p.name === 'request')['schema']['properties']['params']['properties']
        ?? []
    ) ?? [];
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BTPError(ERR_INVALID_FORMAT, { name: 'api desc' });
    }
    throw error;
  }
}

function _formatReadableSupportedNewtorks (value: any) {
  checkType(typeof(value) === 'object');
  try {
    return value['parameters'].find((parameter: any) => parameter.name === 'network')['schema']['enum'];
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BTPError(ERR_INVALID_FORMAT, { name: 'api desc' });
    }
    throw error;
  }
}
