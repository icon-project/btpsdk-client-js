import { assert } from "../utils/errors";
import type {
  Provider,
  Receipt,
  Network,
} from "./types";
import {
  BTPError,
} from "../utils/errors";

export class PendingTransaction {
  #provider: Provider;
  #network: Network;
  #id: string;
  #receipt: Receipt | null= null;

  constructor(provider: Provider, network: Network, id: string) {
    this.#provider = provider;
    this.#network = network;
    this.#id = id;
  }

  get id() {
    return this.#id;
  }

  async wait(status: 'created' | 'finalized' = 'created', timeout: number = 0): Promise<Receipt> {
    let hdl;
    return new Promise(async (resolve, reject) => {
      if (timeout > 0) {
        setTimeout(() => {
          reject(new Error('timeout'));
        }, timeout);
      }

      if (this.#receipt == null) {
        try {
          this.#receipt = await this.#provider.getTransactionResult(this.#network, this.#id);
        } catch (error) {
          assert(BTPError.is(error), 'TODO handle transaction result error');
          throw error;
        }
      }

      if (status === 'created') {
        resolve(this.#receipt!!);
      } else if (status === 'finalized') {
        const onFinalized = async (error: BTPError) => {
          if (error != null) {
            reject(error);
          } else {
            resolve(this.#receipt!!);
          }
        };

        this.#provider.once('block', {
          network: this.#network,
          status,
          id: this.#receipt!!.block.id,
          height: this.#receipt!!.block.height
        }, onFinalized);
      } else {
        reject(new Error('??'))
      }
    });
  }
}
