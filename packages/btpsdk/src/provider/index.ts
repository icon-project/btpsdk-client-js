export * from './provider';
export * from './signer';
export * from './transaction';
export * from './eventlog';
export * from './blockevent';
export * from './request';

export type WebSocketCreator = () => WebSocketLike;

export interface WebSocketLike {
  onopen: null | ((ev: any) => any);
  onclose: null | ((ev: any) => any);
  onmessage: null | ((ev: { data: ArrayBuffer }) => any);
  onerror: null | ((ev: any) => any);
  send(payload: any): void;
  close: ((code?: number) => void);
}
