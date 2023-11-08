import { read } from './utils';
import { NetworkType } from '../src/provider/types';
import {
  formatReceipt,
  formatEventLog,
} from '../src/provider/formatter';

describe('Test data converter/formatter for network-specific data formats', () => {
  it('format icon receipt', () => {
    const receipt = JSON.parse(read('receipt.icon.json').toString());
    expect(formatReceipt('icon' as NetworkType, receipt)).toEqual({
      block: {
        id: receipt.BlockHash,
        height: receipt.BlockHeight
      }
    })
  });

  it('format evm receipt', () => {
    const receipt = JSON.parse(read('receipt.bsc.json').toString());
    expect(formatReceipt('bsc' as NetworkType, receipt)).toEqual({
      block: {
        id: receipt.Raw.blockHash,
        height: Number.parseInt(receipt.Raw.blockNumber, 16)
      }
    })
  });

  it('format icon eventlog', () => {
    const eventlog = JSON.parse(read('eventlog.icon.json').toString());
    expect(formatEventLog('icon' as NetworkType, eventlog)).toEqual({
      block: {
        id: eventlog.BaseEvent.BlockHash,
        height: eventlog.BaseEvent.BlockHeight
      },
      tx: {
        id: eventlog.BaseEvent.TxHash,
        index: eventlog.BaseEvent.TxIndex,
      },
      index: eventlog.BaseEvent.IndexInTx,
      payload: {
        name: eventlog.Name,
        params: eventlog.Params,
      }
    });
  });

  it('format evm eventlog', () => {
    const eventlog = JSON.parse(read('eventlog.bsc.json').toString());
    expect(formatEventLog('bsc' as NetworkType, eventlog)).toEqual({
      block: {
        id: eventlog.BaseEvent.Raw.blockHash,
        height: Number.parseInt(eventlog.BaseEvent.Raw.blockNumber, 16),
      },
      tx: {
        id: eventlog.BaseEvent.Raw.transactionHash,
        index: Number.parseInt(eventlog.BaseEvent.Raw.transactionIndex, 16),
      },
      index: Number.parseInt(eventlog.BaseEvent.Raw.logIndex, 16),
      payload: {
        name: eventlog.Name,
        params: eventlog.Params,
      }
    });
  });

});
