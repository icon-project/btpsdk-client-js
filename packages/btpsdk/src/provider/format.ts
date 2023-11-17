import type {
  Network,
  NetworkType,
  ServiceInfo,
  ServiceDesc,
} from './provider';

import {
  BTPError,
  ERR_INVALID_FORMAT,
  ERR_UNKNOWN_NETWORK_TYPE,
} from '../error/index';

import type { EventLog } from './eventlog';

import { getLogger } from '../utils/log';
const log = getLogger('format');

function checkType (condition: boolean): asserts condition {
  if (!condition) throw new BTPError(ERR_INVALID_FORMAT);
}

// format response of `/api`
export function formatServicesInfo (value: any): Array<ServiceInfo> {
  checkType(Array.isArray(value));

  return value.map(({ name, networks }: {
    name: string,
    networks: {
      [name: string]: NetworkType
    }
  }) => {
    checkType(typeof(name) === 'string');
    checkType(typeof(networks) === 'object');
    return {
      name,
      networks: Object.entries(networks).map(([ name, type ]) => {
        return { name, type };
      })
    };
  });
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
    const prefix = `/api/${info.name}/`;
    const regexp = new RegExp(`^${prefix}`);

    const paths = Object.entries(value['paths']);
    const apis = paths.filter(([name]) => regexp.test(name));

    return {
      name: info.name,
      networks: info.networks,
      methods: apis.length <= 0 ? [] : apis.map(([ name, desc ]: [ string, any ]) => {
        let methods = { name: name.slice(prefix.length, name.length), readonly: desc.get != null };
        if (desc.post != null) {
          return {
            ...methods,
            inputs: _formatWritableMethodInputs(desc.post),
            networks: _formatWritableMethodSupportedNetworks(desc.post),
          }
        } else if (desc.get != null) {
          return {
            ...methods,
            inputs: _formatReadableMethodInputs(desc.get),
            networks: _formatReadableSupportedNewtorks(desc.get),
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
    inputs = value.requestBody.content['application/json'].schema.properties.params.properties;
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
    return value.requestBody.content['application/json'].schema.properties.network.enum;
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
      value.parameters.find((p: any) => p.name === 'request').schema.properties.params.properties
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
    return value.parameters.find((parameter: any) => parameter.name === 'network').schema.enum;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new BTPError(ERR_INVALID_FORMAT, { name: 'api desc' });
    }
    throw error;
  }
}

type BTPEventLog = IconEventLog | EvmEventLog;

interface CommonEventLog {
  Name: string,
  Params: Map<string, any>;
}

interface IconEventLog extends CommonEventLog {
  BaseEvent: {
    BlockHash: string;
    BlockHeight: number;
    TxHash: string;
    TxIndex: number;
    IndexInTx: number;
  }
}

interface EvmEventLog extends CommonEventLog {
  BaseEvent: {
    Raw: {
      blockHash: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
      logIndex: string;
    }
  }
}

export const formatEventLog = (type: NetworkType, eventLog: BTPEventLog): EventLog => {
  switch (type) {
    case 'icon': {
      const el = eventLog as IconEventLog;
      return {
        block: {
          id: el.BaseEvent.BlockHash,
          height: el.BaseEvent.BlockHeight,
        },
        tx: {
          id: el.BaseEvent.TxHash,
          index: el.BaseEvent.TxIndex,
        },
        index: el.BaseEvent.IndexInTx,
        payload: {
          name: el.Name,
          params: el.Params
        }
      }
    }
    case 'eth2':
    case 'bsc': {
      const el = eventLog as EvmEventLog;
      return {
        block: {
          id: el.BaseEvent.Raw.blockHash,
          height: Number.parseInt(el.BaseEvent.Raw.blockNumber, 16),
        },
        tx: {
          id: el.BaseEvent.Raw.transactionHash,
          index: Number.parseInt(el.BaseEvent.Raw.transactionIndex, 16),
        },
        index: Number.parseInt(el.BaseEvent.Raw.logIndex, 16),
        payload: {
          name: el.Name,
          params: el.Params
        }
      }
    }
    default: {
      throw new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type });
    }
  }
}


import type { Receipt } from './transaction';

type IconReceipt = {
  Raw: {
    to: string;
    cumulativeStepUsed: string;
    stepUsed: string;
    stepPrice: string;
    eventLogs: Array<{
      scoreAddress: string;
      indexed: Array<string>;
      data: Array<string>;
    }>;
    logsBloom: string;
    status: string;
    blockHash: string;
    blockHeight: string;
    txIndex: string;
    txHash: string;
  },
  BlockHash: string;
  BlockHeight: number;
  Failure: null;
};

type EvmReceipt = {
  Raw: {
    type: string;
    root: string;
    status: string;
    cumulativeGasUsed: string;
    logsBloom: string;
    logs: Array<{
      address: string;
      topics: Array<string>;
      data: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
      blockHash: string
      logIndex: string;
      removed: false;
    }>;
    transactionHash: string;
    contractAddress: string;
    gasUsed: string;
    effectiveGasPrice: string;
    blockHash: string;
    blockNumber: string;
    transactionIndex: string;
  },
  Failure: null;
}

export const formatReceipt = (type: NetworkType, value: any): Receipt => {
  switch (type) {
    case 'icon': {
      checkType(typeof(value.BlockHash) === 'string')
      checkType(typeof(value.BlockHeight) === 'number')
      const receipt = value as IconReceipt;
      return {
        block: {
          id: receipt.BlockHash,
          height: receipt.BlockHeight
        },
        cumulativeUsed: receipt.Raw.cumulativeStepUsed,
        used: receipt.Raw.stepUsed,
        price: receipt.Raw.stepPrice,
        logs: receipt.Raw.eventLogs,
      }
    }
    case 'eth2':
    case 'bsc': {
      checkType(typeof(value.Raw) === 'object')
      checkType(typeof(value.Raw.blockHash) === 'string')
      checkType(typeof(value.Raw.blockNumber) === 'string')
      const receipt = value as EvmReceipt;
      return {
        block: {
          id: receipt.Raw.blockHash,
          height: Number.parseInt(receipt.Raw.blockNumber, 16),
        },
        cumulativeUsed: receipt.Raw.cumulativeGasUsed,
        used: receipt.Raw.gasUsed,
        price: receipt.Raw.effectiveGasPrice,
        logs: receipt.Raw.logs,
      }
    }
    default: {
      throw new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type });
    }
  }
}


import type {
  TransactOpts,
  IconTransactOpts,
  EvmTransactOpts,
} from './transaction';

export const formatTransactOpts = (type: NetworkType, options: TransactOpts) => {
  const common = ['from', 'value', 'estmate', 'signature'];
  switch (type) {
    case 'icon': {
      const props = common.concat(['stepLimit', 'timestamp']);
      return Object.fromEntries(Object.entries(options).filter(([name]) => props.includes(name))) as IconTransactOpts;
    }
    case 'eth2':
    case 'bsc': {
      const props = common.concat(['gasPrice', 'gasLimit', 'gasFeeCap', 'gasTipCap', 'nonce']);
      return Object.fromEntries(Object.entries(options).filter(([name]) => props.includes(name))) as EvmTransactOpts;
    }
    default:
      throw new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type });
  }
}
