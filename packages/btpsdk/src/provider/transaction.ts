import {
  BTPError,
  ERR_TIMEOUT,
} from "../error/index";

import type {
  Network,
  Provider,
} from './provider';

import type {
  Signer,
} from './signer';

export type Receipt = IconReceipt | EthReceipt;

export interface BaseReceipt {
  block: {
    id: string;
    height: number;
  },
  cumulativeUsed: string;
  used: string;
  price: string;
}

export interface IconReceipt extends BaseReceipt {
  logs: Array<{
    scoreAddress: string;
    indexed: Array<string>;
    data: Array<string>;
  }>;
}

export interface EthReceipt extends BaseReceipt {
  logs: Array<{
    address: string;
    topics: Array<string>;
    data: string;
    blockHash: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    logIndex: string;
    removed: boolean;
  }>;
}

import { getLogger } from '../utils/log';

const log = getLogger('transaction');

export type TransactOpts = IconTransactOpts | EvmTransactOpts;

export interface BaseTransactOpts {
  signer?: Signer;
  signature?: string;

  from?: string;
  value?: number
  estimate?: boolean;
}

export interface IconTransactOpts extends BaseTransactOpts {
  stepLimit?: number;
  timestamp?: number;
}

export interface EvmTransactOpts extends BaseTransactOpts {
  gasPrice?: number;
  gasLimit?: number;
  gasFeeCap?: number;
  gasTipCap?: number;
  nonce?: number;
}

export type CallOpts = {
  from?: string;
};

export class PendingTransaction {
  #provider: Provider;
  #network: Network;
  #id: string;

  constructor(provider: Provider, network: Network, id: string) {
    this.#provider = provider;
    this.#network = network;
    this.#id = id;
  }

  get network() {
    return this.#network;
  }

  get id() {
    return this.#id;
  }

  async wait(status: 'created' | 'finalized' = 'created', timeout: number = 0): Promise<Receipt> {
    let onFinalized: null | ((error: BTPError) => void);

    const receipt = await this.#provider.getTransactionResult(this.#network, this.#id);
    if (status === 'created') {
      return receipt;
    } else if (status === 'finalized') {
      return new Promise((resolve, reject) => {
        if (timeout > 0) {
          setTimeout(() => {
            log.debug(`timeout - txid(${this.#id})`);
            if (onFinalized != null) {
              this.#provider.off('block', onFinalized);
              onFinalized = null;
            }
            return reject(new BTPError(ERR_TIMEOUT));
          }, timeout);
        }

        onFinalized = (error: BTPError) => {
          if (error != null) {
            return reject(error);
          } else {
            return resolve(receipt);
          }
        };

        this.#provider.once('block', {
          network: this.#network,
          status,
          id: receipt.block.id,
          height: receipt.block.height
        }, onFinalized);

      });
    } else {
      throw new Error();
    }
  }
}
