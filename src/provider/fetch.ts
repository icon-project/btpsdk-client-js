import http from "http";
import path from "path";
import https from "https";
import url from 'url';
import { assert } from "../utils/errors";
import { FetchRequest, FetchResponse } from './types';

export async function doFetch(req: FetchRequest): Promise<FetchResponse> {
  assert(req.url != null);
  // TODO improve endpoint merger
  const endpoint = req.path != null ? path.join(req.url, req.path) : req.url;
  let protocol: string | undefined = url.parse(endpoint ?? '').protocol ?? undefined;
  protocol = protocol?.slice(0, protocol.length-1);
  if (protocol !== 'http' && protocol !== 'https') {
    throw new Error(`unsupported protocol - protocol(${protocol})`);
  }

  const method = req.method;
  const headers = Object.assign({}, req.headers);
  const options = { method, headers }

  const request = ((protocol === "http") ? http: https).request(endpoint ?? '', options);
  const body = req.body;
  if (body) { request.write(Buffer.from(body)); }

  request.end();

  return new Promise((resolve, reject) => {
    request.once("response", (resp: http.IncomingMessage) => {
      const statusCode = resp.statusCode || 0;
      const statusMessage = resp.statusMessage || "";
      const headers = Object.keys(resp.headers || {}).reduce((accum, name) => {
        let value = resp.headers[name] || "";
        if (Array.isArray(value)) {
          value = value.join(", ");
        }
        accum[name] = value;
        return accum;
      }, <{ [ name: string ]: string }>{ });

      let body: null | Uint8Array = null;

      resp.on("data", (chunk: Uint8Array) => {
        if (body == null) {
          body = chunk;
        } else {
          const newBody = new Uint8Array(body.length + chunk.length);
          newBody.set(body, 0);
          newBody.set(chunk, body.length);
          body = newBody;
        }
      });

      resp.on("end", () => {
        resolve({ statusCode, statusMessage, headers, body });
      });

      resp.on("error", (error) => {
        //@TODO: Should this just return nornal response with a server error?
        (<any>error).response = { statusCode, statusMessage, headers, body };
        reject(error);
      });
    });

    request.on("error", (error) => { reject(error); });
  });
}
