import {
  ServiceDescription,
  Service,
} from '../src/service/index';

import {
  BTPProvider,
  Provider,
} from '../src/provider/index';

function getTestProvider(): Provider {
  return new BTPProvider('http://20.20.0.32:10080');
}

describe('service', () => {
  const desc: ServiceDescription = {
    name: 'dappsample',
    networks: [
      {
        name: 'icon:berlin',
        type: 'icon'
      }, {
        name: 'bsc:chapel',
        type: 'bsc'
      }
    ],
    methods: [
      {
        name: 'send',
        networks: [ 'icon:berlin', 'bsc:chapel' ],
        inputs: [ '_to', '_msg' ],
        readonly: false,
      }, {
        name: 'approve',
        networks: [ 'icon:berlin' ],
        inputs: [ '_to', '_amount' ],
        readonly: false,
      }, {
        name: 'at',
        networks: [ 'icon:berlin' ],
        inputs: [ '_to', '_msg' ],
        readonly: true
      }
    ]
  };

  it('bind dynamic service method', () => {
    const provider = getTestProvider();
    const service = new Service(provider, desc);
    expect(service.send !== undefined).toBeTruthy();
    expect(service.send === service.getFunction('send')).toBeTruthy();
  });

  it('doesn\'t bind dynamic service method, if the name is the same as builtin method', () => {
    const provider = getTestProvider();
    const service = new Service(provider, desc);
    expect(service.at !== undefined).toBeTruthy();
    expect(service.at !== service.getFunction('at') as unknown).toBeTruthy();
  });
});
