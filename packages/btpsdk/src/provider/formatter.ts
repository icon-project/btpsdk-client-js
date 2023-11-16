import type { NetworkType } from './provider';
import type { EventLog } from './eventlog';
import {
  BTPError,
  ERR_UNKNOWN_NETWORK_TYPE,
} from '../error/index';

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

export type BTPReceipt = IconReceipt | EvmReceipt;
type IconReceipt = {
  BlockHash: string;
  BlockHeight: number;
};
type EvmReceipt = {
  Raw: {
    blockHash: string;
    blockNumber: string;
  }
}

export const formatReceipt = (type: NetworkType, receipt: BTPReceipt): Receipt => {
  switch (type) {
    case 'icon': {
      const _receipt = receipt as IconReceipt;
      return {
        block: {
          id: _receipt.BlockHash,
          height: _receipt.BlockHeight
        }
      }
    }
    case 'eth2':
    case 'bsc': {
      const _receipt = receipt as EvmReceipt;
      return {
        block: {
          id: _receipt.Raw.blockHash,
          height: Number.parseInt(_receipt.Raw.blockNumber, 16),
        }
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
