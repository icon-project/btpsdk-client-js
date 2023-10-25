import type {
  FetchRequest,
  FetchResponse,
} from './types';

declare global {
    class Headers {
        constructor(values: Array<[ string, string ]>);
        forEach(func: (v: string, k: string) => void): void;
    }

    class Response {
        status: number;
        statusText: string;
        headers: Headers;
        arrayBuffer(): Promise<ArrayBuffer>;
    }

    type FetchInit = {
        method?: string,
        headers?: Headers,
        body?: Uint8Array
    };

    function fetch(url: string, init: FetchInit): Promise<Response>;
}

export async function doFetch(req: FetchRequest): Promise<FetchResponse> {
  const protocol = (new URL(req.url ?? '')).protocol.slice(0, -1);
  if (protocol !== 'http' && protocol !== 'https') {
    throw new Error(`unsupported protocol - protocol(${protocol})`);
  }

  const endpoint = new URL(req.path ?? '', req.url).href;

  const init = {
    method: req.method,
    headers: new Headers(Object.entries(req.headers)),
    body: req.body || undefined,
  };

  console.log('??');
  console.log('requrl:', endpoint);
  const resp = await fetch(endpoint, init);

  const headers: Record<string, string> = { };
  resp.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const respBody = await resp.arrayBuffer();
  const body = (respBody == null) ? null: new Uint8Array(respBody);

  console.log('resp:status:', resp.status, headers, body);

  return {
    statusCode: resp.status,
    statusMessage: resp.statusText,
    headers, body
  };
}
