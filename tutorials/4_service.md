
```javascript
(async () => {
  ...

  // get all btp services
  const services = await provider.services();
  const token = services.find(service => service.name == 'token');

  // get a service named `token`
  const token = await provider.service('token');

  // create service with service description
  const token = new Service(provider, {
    name: 'token',
    networks: [ {
      name: 'icon:berlin',
      type: 'icon'
    }, {
      name: 'bsc:chapel',
      type: 'bsc'
    }, {
      name: 'eth:sepolia',
      type: 'eth2'
    }],
    methods: [
      {
        name: 'decimals',
        networks: [ 'icon:berlin', 'bsc:chapel', 'eth:sepolia' ],
        inputs: [],
        readonly: true

      }, {
        name: 'transfer',
        networks: [ 'icon:berlin', 'bsc:chapel', 'eth:sepolia' ],
        inputs: [ '_to', '_amount' ],
        readonly: false
      }, ...
    ]
  });

  const decimals = await token.decimals('icon:berlin');
  // decimals === 16

  // Add event listener for `Transfer` event for `bsc:chapel` network
  token.on('bsc:chapel', 'Transfer', (event) => {
    ...
  });
  const tx = await token.transfer('icon:berlin', {
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  });
  const receipt = await tx.wait();
})();
```

the following codes perform the same behavior as in the codes above.

```javascript
  const service = await provider.service('token');

  {
    const token = service.at('bsc:chapel');
    token.once('Transfer', (event) => {
      ...
    });
  }

  // retrieve `token` contract on `icon:berlin` network from `token` service
  const token = token.at('icon:berlin');
  const decimals = await token.decimals();
  // decimals === 16

  const tx = await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  });
  const receipt = await tx.wait();
```

### Retrieve receipt for a transaction
```javascript
(async () => {
  ...
  const service = await provider.service('token');
  const token = token.at('icon:berlin');

  // send transaction for `transfer`
  const tx = await token.transfer({
    _to: 'btp://0x2.bsc/0x11...',
    _amount: 1000
  });

  // a receipt for the transaction,
  // but a block which contains the receipt can be excluded from the canonical blockchain
  const receipt = await tx.wait();
  const receipt = await tx.wait('created');

  // a receipt for the transaction, a block which contains the receipt belongs to the canonical blockchain
  const receipt = await tx.wait('finalized');

  // or with timeout
  const receipt = await tx.wait('finalized', 5000);

  // or with provider
  const timer = setInterval(() => {
    const finalized = provider.getBlockFinality(token.network, tx.block.id, tx.block.height);
    if (finalized) {
        clearInterval(timer);
    }
  }, 1000);
})();
```

