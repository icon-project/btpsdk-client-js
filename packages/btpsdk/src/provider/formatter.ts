import {
  NetworkType,
} from './types';

import {
  BTPError,
  ERR_UNKNOWN_NETWORK_TYPE,
  ERR_NOT_IMPLEMENTED,
} from '../error/index';

import { LogEvent } from './event/eventlog';
export const formatEventLog = (type: NetworkType, eventLog: any): LogEvent => {
  switch (type) {
    case 'icon': {
      return {
        block: {
          id: eventLog.BaseEvent.BlockHash,
          height: eventLog.BaseEvent.BlockHeight,
        },
        tx: {
          id: eventLog.BaseEvent.TxHash,
          index: eventLog.BaseEvent.TxIndex,
        },
        index: eventLog.BaseEvent.IndexInTx,
        payload: {
          name: eventLog.Name,
          params: eventLog.Params
        }
      }
    }
    case 'eth2':
    case 'bsc': {
      return {
        block: {
          id: eventLog.BaseEvent.Raw.blockHash,
          height: Number.parseInt(eventLog.BaseEvent.Raw.blockNumber, 16),
        },
        tx: {
          id: eventLog.BaseEvent.Raw.transactionHash,
          index: 0,
        },
        index: 0,
        payload: {
          name: eventLog.Name,
          params: eventLog.Params
        }
      }
    }
    default: {
      throw new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type });
    }
  }
}

import type { Receipt } from './types';
export const formatReceipt = (type: NetworkType, receipt: any): Receipt => {
  switch (type) {
    case 'icon': {
      throw new BTPError(ERR_NOT_IMPLEMENTED);
    }
    case 'eth2':
    case 'bsc': {
      return {
        block: {
          id: receipt.Raw.blockHash,
          height: Number.parseInt(receipt.Raw.blockNumber, 16),
        }
      }
    }
    default: {
      throw new BTPError(ERR_UNKNOWN_NETWORK_TYPE);
    }
  }
}