import type {
  PendingTransaction,
} from "./transaction";

import type {
  ServiceDescription,
  Listener,
} from "../service/types";

import { Service } from "../service/service";


export type NetworkType = 'icon' | 'eth';

export interface Network {
  name: string;
  type: NetworkType;
}

export {
  PendingTransaction,
};

export type EventFilter = LogFilter | BlockFilter;

export type EventType = 'log' | 'block';

export interface LogFilter {
  network: string | Network;
  service: string;
  event: {
    name: string;
    params?: Map<string, any> | Array<Map<string, any>>;
  }
}

export interface BlockFilter {
  network: string | Network;
  status: 'finalized',
  id: string;
  height: number;
}

export interface Provider {
  services(): Promise<Array<Service>>;
  service(nameOrDesc: string | ServiceDescription): Promise<Service>;
  transact(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts: TransactOpts): Promise<PendingTransaction>;
  call(network: Network | string, service: string, method: string, params: { [key: string]: any }, opts: CallOpts): Promise<any>;
  getTransactionResult(network: Network, id: string): Promise<Receipt>;
  getBlockFinality(network: string, id: string, height: number): Promise<boolean>;
  on(type: 'log', filter: EventFilter, listener: Listener): this;
  once(type: EventType, filter: EventFilter, listener: Listener): this;
  off(type: EventType, listener?: Listener): this;
}

export interface Signer {
  address(): Promise<string>;
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
