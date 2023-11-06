import assert from "assert";

import {
  Provider as IProvider,
  EventFilter,
  Receipt,
  CallOpts,
  TransactOpts,
  Network,
  PendingTransaction,
} from "../../provider";

import {
  ServiceDescription,
} from "../../service";

import {
  Service,
} from "../../service/service";

import {
  Listener,
} from "../../service/types";

import {
  BTPError,
  ERR_INCONSISTENT_BLOCK,
} from "../../error/index";

import {
  BlockChain,
  Block,
} from "./blockchain";

export class Provider implements IProvider {
  readonly url = "";
  readonly blockchain: BlockChain;

  readonly finalities: Map<number, Block> = new Map();

  constructor(blockchain: BlockChain) {
    this.blockchain = blockchain;

    blockchain.on('created', (block: Block) => {
      const finality = blockchain.finalized();
      //assert(this.finalities.size == finality.height + 1, `size: ${this.finalities.size}, finality height: ${finality.height}`);
      this.finalities.set(finality.height, finality);
    });
  }

  services(): Promise<Array<Service>> {
    throw new Error("Method not implemented.");
  }

  service(nameOrDesc: string | ServiceDescription): Promise<Service> {
    throw new Error("Method not implemented.");
  }

  transact(network: string | Network, service: string, method: string, params: { [key: string]: any; }, opts: TransactOpts): Promise<PendingTransaction> {
    throw new Error("Method not implemented.");
  }

  call(network: string | Network, service: string, method: string, params: { [key: string]: any; }, opts: CallOpts): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve('btp://0x1.icon.cx1...');
    });
  }

  getTransactionResult(network: Network, id: string): Promise<Receipt> {
    throw new Error("Method not implemented.");
  }

  getBlockFinality(network: string, id: string, height: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const finalized = this.finalities.get(height)!!;
      if (finalized == null) {
        resolve(false);
      } else {
        if (finalized.id == id) {
          resolve(true);
        } else {
          reject(new BTPError(ERR_INCONSISTENT_BLOCK));
        }
      }
    });
  }

  on(type: "log", filter: EventFilter, listener: Listener): this {
    throw new Error("Method not implemented.");
  }

  once(type: "log" | "block", filter: EventFilter, listener: Listener): this {
    throw new Error("Method not implemented.");
  }

  off(type: "log" | "block", listener?: Listener): this {
    throw new Error("Method not implemented.");
  }

}
