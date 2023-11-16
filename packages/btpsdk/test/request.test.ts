import {
  DefaultHttpProvider
} from '../src/provider/request';

import {
  ServerRejectError,
} from '../src/error/index';

import { IS_E2E } from './utils/config';
import { itIf } from './utils/jest';

import {
  getTestHttpProvider,
  TestHttpServer,
} from './utils/config';

describe('http provider tests', () => {
  it('should retrieve `baseUrl` and `response` with mock provider', async () => {
    const data = {
      baseUrl: 'http://example.com',
      json: {
        name: 'alice'
      },
      status: 200
    };
    const provider = new DefaultHttpProvider(getTestHttpProvider(data));

    expect(provider.baseUrl).toBe(data.baseUrl);
    expect(await provider.request<{ name: string }>('/name', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })).toStrictEqual(data.json);
  });

  it('should retrieve `baseUrl` and `404 response` with mock provider', async () => {
    const data = {
      baseUrl: 'http://example.com',
      status: 404,
      json: {
        code: 1001,
        message: 'code=404, message=Not Found',
        data: null
      }
    }
    const provider = new DefaultHttpProvider(getTestHttpProvider(data));

    await expect(() => provider.request('/anywhere')).rejects.toThrow(
      new ServerRejectError({ code: data.status, message: data.json.message }));
  });

  it('should retrieve `baseUrl` and `response` with normal provider', async () => {
    const PORT = 8001
    const BASE_URL = `http://localhost:${PORT}`;
    const backend = new TestHttpServer();
    const resData = [
      {
        "name": "dappsample",
        "networks": {
          "bsc_test": "bsc",
          "eth2_test": "eth2",
          "icon_test": "icon"
        }
      }
    ];

    const provider = new DefaultHttpProvider(BASE_URL);
    backend.start(PORT)
      .handle('/api', 'GET', JSON.stringify(resData));

    expect(provider.baseUrl).toBe(BASE_URL);
    expect(await provider.request<Array<{
      name: string,
      networks: Array<{ [ name: string ]: string }>,
    }>>('/api')).toStrictEqual(resData);

    backend.stop();
  });

  // TODO extract backend specific data
  itIf(IS_E2E, 'e2e', async () => {
    const provider = new DefaultHttpProvider('http://20.20.0.32:10080');
    expect(await provider.request<Array<{
      name: string,
      networks: { [ name: string ]: string },
    }>>('/api')).toEqual(expect.arrayContaining([
      {
        name: 'xcall',
        networks: { bsc_test: 'bsc', eth2_test: 'eth2', icon_test: 'icon' }
      },
      {
        name: 'dappsample',
        networks: { bsc_test: 'bsc', eth2_test: 'eth2', icon_test: 'icon' }
      },
      {
        name: 'bmc',
        networks: { bsc_test: 'bsc', eth2_test: 'eth2', icon_test: 'icon' }
      }
    ]));
  });

});
