BTPSDK-CLIENT-JS
================

btpsdk-client-js is a js client library written in Typescript for [btpsdk](https://github.com/icon-project/btp-sdk)

## Installation

### Using NPM
```bash
npm install @iconfoundation/btpsdk
```

### Using Yarn
```bash
yarn add @iconfoundation/btpsdk
```

### Using CDN
```html
<script src="https://cdn.jsdelivr.net/npm/-@x.x.x/dist/btp.min.js"></script>
```

## API Documentation
generate api documentation, and visit to http://localhost:8000 in your browser
```bash
npm run doc
cd doc
python3 -m http.server 8000
```

## Getting Started
### Import library
```javascript
// cjs style
const btp = require('@iconfoundation/btpsdk');
or
const { BTPProvider } = require('@iconfoundation/btpsdk');
```
```javascript
// esm style
import btp from '@iconfoundation/btpsdk';
// or
import { BTPProvider } from '@iconfoundation/btpsdk';
```

### Create BTP Provider
```javascript
import { BTPProvider } from '@iconfoundation/btpsdk';

const provider = new BTPProvider('${BTP_SDK_URL');
```

### Get BTP Networks
```javascript
(async () => {
    ...
    const networks = await provider.networks();
    // [ { name: '...', type: '...' }, ... ]

})();
```

### Get BTP Services
```javascript
(async () => {
    ...
    // all services
    const services = await provider.services();
    // [ Service, ... ]

    // service named `token`
    const service = await provider.service('token');

    // contract on specific network
    const contract = await service.at('icon:berlin');
})();
```

### Call writable functions of service(contract)
```javascript
(async () => {
    ...
    const tx = await token.transfer('${network name}', { _to: 'btp://0x1.icon/hx11...', _amount: 100 });
    // { id: '0x...', ... }

    // wait receipt
    const receipt = await tx.wait();

    // finalized receipt
    const receipt = await tx.wait('finalized');

    // wait finalized receipt
    const until = 5000; // 5 seconds
    const receipt = await tx.wait('finalized', until);

})();
```

### Call writable function of service with user signer
```javascript
(async () => {
    ...

    // `transfer` transaction signed by server-side wallet
    contract.transfer({ _to: 'btp://0x2.bsc/0x11...', _amount: 100 });

    // `transfer` transaction signed with hana-wallet chrome-extension
    import { WebHanaSigner } from '@iconfoundation/btpsdk-web-signer';
    const hana = new WebHanaSigner();
    contract.transfer({ _to: 'btp://0x2.bsc/0x11...', _amount: 100 }, { signer: hana });

    // `transfer` transaction signed with user implemented signer
    import type { Signer } from '@iconfoundation/btpsdk';
    class UserSigner implements Signer {
        ...
    }
    new user = new UserSigner();
    contract.transfer({ _to: 'btp://0x2.bsc/0x11...', _amount: 100 }, { signer: user });
})();
```

### Call readonly functions of service(contract)
```javascript

(async () => {
    ...
    const decimals = await token.decimals();
})();
```

### Listen service events
```javascript
(async () => {
    ...

    const listener = (error, ev) => {
        ...
    }
    token.on('Transfer', listener);
    token.off(listener);

    // or
    token.once('Transfer', listener);

    // or with filters
    token.once('Transfer', { _from: 'btp://0x2.eth/0x22...' }, (error, event) => {
        ...
    });
})();
```
