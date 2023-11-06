import type {
  PendingTransaction,
} from "./transaction";

import type {
  EventEmitter,
} from './event';

import type {
  ServiceDescription,
} from "../service/types";

import { Service } from "../service/service";


export type NetworkType = 'icon' | 'eth2' | 'bsc';

export interface Network {
  name: string;
  type: NetworkType;
}

export {
  PendingTransaction,
};

export type EventType = 'log' | 'block';

export interface Provider extends EventEmitter {
  services(): Promise<Array<Service>>;
  service(nameOrDesc: string | ServiceDescription): Promise<Service>;
  transact(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts?: TransactOpts): Promise<PendingTransaction>;
  call(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts: CallOpts): Promise<any>;
  getTransactionResult(network: Network, id: string): Promise<Receipt>;
  getBlockFinality(network: string, id: string, height: number): Promise<boolean>;
}

export interface Signer {
  init(): Promise<void>;
  supports(type: string): boolean;
  supports(): Array<string>;
  address(type: string): Promise<string>;
  sign(type: string, message: string): Promise<string>;
}

export interface FetchResponse {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string>;
  body: Uint8Array | null;
}

export interface FetchRequest {
  url?: string;
  path?: string;
  method: FetchMethod;
  headers: Record<string, string>;
  body: Uint8Array | null;
}

export type TransactOpts = IcxTransactOpts | EthTransactOpts;

export interface BaseTransactOpts {
  signer?: Signer;
  from?: string;
  signature?: string;
}

export interface IcxTransactOpts extends BaseTransactOpts {
  from?: string;
  signature?: string;
}

export interface EthTransactOpts extends BaseTransactOpts {
  from?: string;
  signature?: string;
}

export type CallOpts = IcxCallOpts | EthCallOpts;

export interface IcxCallOpts {
}

export interface EthCallOpts {
}


export type FetchFunc = (request: FetchRequest) => Promise<FetchResponse>;

export type FetchMethod = 'POST' | 'GET' | 'PUT' | 'DELETE';

export interface FetchOpts {
  url: string;
}

export type Receipt = IcxReceipt | EthReceipt;

export interface BaseReceipt {
  block: {
    id: string,
    height: number;
  }
}

export interface IcxReceipt extends BaseReceipt {
}

export interface EthReceipt extends BaseReceipt {
}
