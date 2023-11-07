import {
  assert,
  BTPError,
  ERR_TIMEOUT,
} from "../error/index";

import type {
  Provider,
  Receipt,
  Network,
} from "./types";

import { getLogger } from '../utils/log';
const log = getLogger('transaction');

export class PendingTransaction {
  #provider: Provider;
  #network: Network;
  #id: string;
  #receipt: Receipt | null = null;

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
    return new Promise(async (resolve, reject) => {
      if (timeout > 0) {
        log.debug(`set timer for waiting for receipt - txid(${this.#id})`);
        setTimeout(() => {
          log.debug(`timeout - txid(${this.#id})`);
          if (onFinalized != null) {
            this.#provider.off('block', onFinalized);
            onFinalized = null;
          }
          reject(new BTPError(ERR_TIMEOUT));
        }, timeout);
      }

      if (this.#receipt == null) {
        try {
          this.#receipt = await this.#provider.getTransactionResult(this.#network, this.#id);
        } catch (error) {
          log.debug(`fail to get receipt - network(${this.#network}) txid(${this.#id}) error(${error})`)
          assert(error instanceof BTPError, 'TODO handle transaction result error');
          throw error;
        }
      }

      if (status === 'created') {
        resolve(this.#receipt!);
      } else if (status === 'finalized') {
        onFinalized = (error: BTPError) => {
          if (error != null) {
            reject(error);
          } else {
            resolve(this.#receipt!);
          }
        };

        this.#provider.once('block', {
          network: this.#network,
          status,
          id: this.#receipt!.block.id,
          height: this.#receipt!.block.height
        }, onFinalized);
      }
    });
  }
}
