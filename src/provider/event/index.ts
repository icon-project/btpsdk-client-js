import {
  Network,
} from '../types';
export type EventListener = (...args: Array<any>) => void;

export type EventFilter = LogFilter | BlockFilter;

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

export interface EventEmitter {
  on(name: string, filter: EventFilter, listener: EventListener): this;
  once(name: string, filter: EventFilter, listener: EventListener): this;
  off(name: string): void;
  off(name: string, listener: EventListener): void;
}

export type WebSocketCreator = () => WebSocketLike;

export interface WebSocketLike {
  onopen: null | ((ev: any) => any);
  onclose: null | ((ev: any) => any);
  onmessage: null | ((ev: { data: ArrayBuffer }) => any);
  onerror: null | ((ev: any) => any);
  send(payload: any): void;
  close: (() => void);
}

export * from './block-finality';
export * from './eventlog';
