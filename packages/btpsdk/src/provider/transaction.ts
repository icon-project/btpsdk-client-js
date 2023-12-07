/*
 * Copyright 2023 ICON Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * base transact options
 *
 * @interface BaseTransactOpts
 * @memberof @iconfoundation/btpsdk
 */
/**
 * a signer object for signing transaction
 *
 * @name BaseTransactOpts#signer
 * @type {Signer=}
 */
/**
 * a signature for a transaction
 *
 * @name BaseTransactOpts#signature
 * @type {string=}
 */
/**
 * a `from` address
 *
 * @name BaseTransactOpts#from
 * @type {string=}
 */
/**
 * amount of concurrency on the network
 *
 * @name BaseTransactOpts#value
 * @type {number=}
 */
/**
 * if true, estimates appropriate amount of resources consumed for transaction,
 * or use default resource limit
 *
 * @name BaseTransactOpts#estimate
 * @type {boolean=}
 */
/**
 * transact options for icon networks
 *
 * @interface IconTransactOpts
 * @extends BaseTransactOpts
 * @memberof @iconfoundation/btpsdk
 */
/**
 * step limit
 *
 * @name IconTransactOpts#stepLimit
 * @type {number=}
 */
/**
 * timestamp
 *
 * @name IconTransactOpts#timestamp
 * @type {number=}
 */
/**
 * transact options for evm networks
 *
 * @interface EvmTransactOpts
 * @extends BaseTransactOpts
 * @memberof @iconfoundation/btpsdk
 */
/**
 * gas price
 *
 * @name EvmTransactOpts#gasPrice
 * @type {number=}
 */
/**
 * gas limit
 *
 * @name EvmTransactOpts#gasLimit
 * @type {number=}
 */
/**
 * gasFeeCap
 *
 * @name EvmTransactOpts#gasFeeCap
 * @type {number=}
 */
/**
 * gasTipCap
 *
 * @name EvmTransactOpts#gasTipCap
 * @type {number=}
 */
/**
 * nonce
 *
 * @name EvmTransactOpts#nonce
 * @type {number=}
 */
/**
 * @typedef {(IconTransactOpts|EvmTransactOpts)} TransactOpts
 */
/**
 * base receipt interface
 *
 * @interface BaseReceipt
 * @memberof @iconfoundation/btpsdk
 */
/**
 * block object
 *
 * @name BaseReceipt#block
 * @type {Object}
 * @property {string} id - block id
 * @property {number} height - block height
 */
/**
 * cumulative used resource for transactions
 *
 * @name BaseReceipt#cumulativeResourceUsed
 * @type {string}
 */
/**
 * used resource for the transaction
 *
 * @name BaseReceipt#resourceUsed
 * @type {string}
 */
/**
 * resource price
 *
 * @name BaseReceipt#resourcePrice
 * @type {string}
 */
/**
 * a receipt for icon networks
 *
 * @interface IconReceipt
 * @extends BaseReceipt
 */
/**
 * event logs
 *
 * @name IconReceipt#logs
 * @type {Array<Object>}
 * @property {string} scoreAddress
 * @property {Array<string>} indexed
 * @property {Array<string>} data
 */
/**
 * a receipt for evm networks
 *
 * @interface EthReceipt
 * @extends BaseReceipt
 */
/**
 * event logs
 *
 * @name EthReceipt#logs
 * @type {Array<Object>}
 * @property {string} address
 * @property {Array<string>} topics
 * @property {string} data
 * @property {string} blockHash
 * @property {string} blockNumber
 * @property {string} transactionHash
 * @property {string} transactionIndex
 * @property {string} logIndex
 * @property {boolean} removed
 */
/**
 * @typedef {IconReceipt|EthReceipt} Receipt
 * @memberof @iconfoundation/btpsdk
 */


import {
  BtpError,
  ErrorCode,
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
  cumulativeResourceUsed: string;
  resourceUsed: string;
  resourcePrice: string;
  failure: {
    code: number;
    message: string;
    data: any;
  } | null;
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

/**
 * PendingTransaction class
 *
 * @memberof @iconfoundation/btpsdk
 */
export class PendingTransaction {
  #provider: Provider;
  #network: Network;
  #id: string;

  /**
   * Create `PendingTransaction` object.
   *
   * @param {Provider} provider
   * @param {Network} network
   * @param {string} id - transaction id
   * @constructor
   */
  constructor(provider: Provider, network: Network, id: string) {
    this.#provider = provider;
    this.#network = network;
    this.#id = id;
  }

  /**
   * network that created the transaction
   *
   * @type {Network}
   * @readonly
   */
  get network() {
    return this.#network;
  }

  /**
   * transaction id
   *
   * @type {string}
   * @readonly
   */
  get id() {
    return this.#id;
  }

  /**
   * Returns receipt for the transaction
   *
   * @param {'created'|'finalized'} status
   * @param {number} timeout - milliseconds
   *
   * @returns {Receipt}
   * @async
   */
  async wait(status: 'created' | 'finalized' = 'created', timeout: number = 0): Promise<Receipt> {
    let onFinalized: null | ((error: BtpError) => void);

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
            return reject(new BtpError(ErrorCode.Timeout));
          }, timeout);
        }

        onFinalized = (error: BtpError) => {
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
