export const IS_E2E = (() => {
  return (process.env.BTP_E2E ?? 'false').toLowerCase() === 'true';
})();

export function getTestHttpProvider(data: {
  baseUrl: string,
  json: any,
  status: number
}) {
  function MockHttpProvider(): Promise<Response> {
    return new Promise((resolve) => {
      const headers = new Headers({
        'content-type': 'application/json'
      });


      resolve({
        ok: (data.status >= 200 && data.status < 300),
        json: async (): Promise<unknown> => {
          return new Promise((resolve) => {
            resolve(data.json);
          });
        },
        status: data.status,
        headers,
      } as Response);
    });
  };

  MockHttpProvider.baseUrl = data.baseUrl;
  return MockHttpProvider;
}

import { createServer } from 'http';
import { parse } from 'url';
type HttpMethod = 'POST' | 'GET';
export class TestHttpServer {
  readonly server;
  readonly handlers: Map<string, Map<HttpMethod, (request: any, response: any) => void>>;

  constructor() {
    this.server = createServer();
    this.handlers = new Map();
  }

  start(port: number) {
    this.server.listen(port);
    this.server.on('request', (request, response) => {
      const path = parse(request.url!).pathname;
      if (!this.handlers.has(path ?? '')) {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'application/json');
        return response.end();
      }

      const handlers = this.handlers.get(path ?? '');
      if (!handlers!.has(request.method as HttpMethod)) {
        response.statusCode = 404;
        return response.end();
      }

      const handler = handlers!.get(request.method as HttpMethod);
      handler!(request, response);
      return response.end();
    });
    return this;
  }

  handle(path: string, method: HttpMethod, resData: string) {
    if (!this.handlers.has(path)) {
      this.handlers.set(path, new Map());
    }
    const handlers = this.handlers.get(path);
    handlers!.set(method, (request: any, response: any) => {
      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.write(resData);
    });
    return this;
  }

  stop() {
    this.server.close();
  }
}
