import { doFetch } from './fetch';
import type {
  FetchOpts,
  FetchRequest,
  FetchResponse,
} from "./types";

export class FetchClient {
  #opts: FetchOpts;

  constructor(opts: FetchOpts) {
    this.#opts = opts;
  }

  send(request: FetchRequest): Promise<FetchResponse> {
    return doFetch(Object.assign(this.#opts, request));
  }
}
