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

## Documentations

On the documentations you can find

 - Terminologies
 - API Documentations
 - API Guides

### Generate documents
generate documents, and visit to http://localhost:8000 in your browser
```bash
npm run doc
cd doc
python3 -m http.server 8000
```
