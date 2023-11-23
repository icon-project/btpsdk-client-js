## Import

### NodeJS
```javascript
const btp = require('@iconfoundation/btpsdk-client-js');

const {
    BTPProvider,
    ...
} = require('@iconfoundation/btpsdk-client-js');

```

### ES6 / TS

```javascript
import btp from '@iconfoundation/btpsdk-client-js';
import {
    BTPProvider,
    ...
} from '@iconfoundation/btpsdk-client-js';
```

## Provider

### Create BTP Provider
```javascript
const provider = new BTPProvider('http://example.com');
```
