#### Sign transaction with predefined signer classes
```javascript
import { Signers } from '@iconfoundation/btpsdk';
import {
  IconWallet,
  EvmWallet,
} from '@iconfoundation/btpsdk-json-signer';

import {
  WebHanaSigner,
} from '@iconfoundation/btpsdk-web-signer';

(async () => {
  ...
  const token = await service.at('icon:berlin');

  // send transaction without signer
  // if the btpsdk server is setting default signer for the network(`icon`),
  // then the transaction will be signed as server signer
  await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  });

  // sign with icon keystore
  await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  }, {
    signer: new IconWallet(JSON.parse('icon-keystore.json'), 'password');
  });

  // sign with hana wallet(chrome extension) on browser
  await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  }, {
    signer: new WebHanaSigner(JSON.parse('icon-keystore.json'), 'password');
  });
})();
```

#### Sign transaction with user defined signer class
```javascript
import { Signer } from '@iconfoundation/btpsdk';

class CustomSigner implements Signer {
  supports(): Array<string> {
    return ['icon'];
  }

  async address(type: string): Promise<string> {
    return 'hx111...';
  }

  async sign(type: string, message: string): Promise<string> {
    ...
    return signature;
  }
}

(async () => {
  // sign with user implemented signer object
  await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  }, {
    signer: new CustomSigner();
  });
})();
```

#### Sign transaction with multiple signer classes
```javascript
import { Signers } from '@iconfoundation/btpsdk';
import {
  WebMetamaskSigner,
  WebHanaSigner,
} from '@iconfoundation/btpsdk-web-signer';

(async () => {
  // sign with multiple signers;
  await service.transfer('bsc:chapel', {
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  }, {
    signer: new Signers(new WebHanaSigner(),
        new WebMetamaskSigner(), new IconWallet(JSON.parse('icon-keystore.json'), 'password'));
  });
})();
```
