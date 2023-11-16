import { WebSocketLike } from "../../src/provider/event";

export class WebSocket implements WebSocketLike {
  onopen: null | ((ev: any) => any);
  onclose: null | ((ev: any) => any);
  onmessage: null | ((ev: any) => any);
  onerror: null | ((ev: any) => any);

  constructor() {
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }
  send(payload: any): void {
    console.log('send:', payload);
  }

  close(): void {
    console.log('close');
    if (this.onclose != null) {
      this.onclose(undefined);
    }
  }
}
