import type {
  Network,
  PendingTransaction,
  TransactOpts,
  CallOpts,
} from "../provider/types";

export interface LogFilter {
  status: 'created' | 'finalized';
  filter: { [key: string]: any };
}

//export type Listener = (network: string, params: { [key: string]: any }) => void;
export type Listener = (...args: Array<any>) => void;

export interface Contract {
  methods: Array<WritableMethod | ReadableMethod>;
  on(type: string, filter: LogFilter, listener: Listener): this;
  on(type: string, listener: Listener): this;
}

export interface ServiceDescription {
  name: string;
  networks: Array<Network>;
  methods: Array<MethodDescription>;
}

export interface MethodDescription {
  name: string;
  // TODO add properties for validating value
  inputs: Array<string>;
  readonly: boolean;
}

type ServiceWritableMethod = (network: string, params: { [key: string]: any }, opts: TransactOpts) => Promise<PendingTransaction>;
type WritableMethod = (params: { [key: string]: any }, opts: TransactOpts) => Promise<PendingTransaction>;

type ServiceReadableMethod = (network: string, params: { [key: string]: any }, opts: CallOpts) => Promise<any>;
type ReadableMethod = (params: { [key: string]: any }, opts: CallOpts) => Promise<any>;

