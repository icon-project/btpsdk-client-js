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
  readonly id: string;
  #receipt: Receipt | null = null;

  constructor(provider: Provider, network: Network, id: string) {
    this.#provider = provider;
    this.#network = network;
    this.id = id;
  }

  async wait(status: 'created' | 'finalized' = 'created', timeout: number = 0): Promise<Receipt> {
    let hdl;
    return new Promise(async (resolve, reject) => {
      if (timeout > 0) {
        setTimeout(() => {
          reject(new BTPError(ERR_TIMEOUT));
        }, timeout);
      }

      if (this.#receipt == null) {
        try {
          this.#receipt = await this.#provider.getTransactionResult(this.#network, this.id);
        } catch (error) {
          assert(error instanceof BTPError, 'TODO handle transaction result error');
          throw error;
        }
      }

      if (status === 'created') {
        resolve(this.#receipt!);
      } else if (status === 'finalized') {
        const onFinalized = async (error: BTPError) => {
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
