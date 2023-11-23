#### Listen block finality events
```javascript
(async () => {
  provider.on('block', {
    network: 'icon:berlin',
  }
})();
```

#### Listen event logs
```javascript
(async () => {
  // with provider
  provider.once('log', {
    network: 'icon:berlin',
    service: 'token',
    event: {
      name: 'Transfer',
    }
  }, (event) => {
    ...
  });

  // with service
  service.once('icon:berlin', 'Transfer', (event) => {
    ...
  });

  // with contract
  contract.once('Transfer', (event) => {
    ...
  });
})();
```

#### Listen event logs with filter
```javascript
(async () => {
  // listen events with filters

  // with provider
  provider.once('log', {
    network: 'icon:berlin',
    service: 'token',
    event: {
      name: 'Transfer',
      params: {
        _from: 'btp://0x2.bsc/0x111...'
      }
    }
  }, (event) => {
     ...
  }),

  // with service
  service.once('icon:berlin', 'Transfer', {
    _from: 'btp://0x2.bsc/0x111...',
  }, (event) => {
    ...
  });

  service.once('icon:berlin', 'Transfer', {
    _from: 'btp://0x2.bsc/0x111...',
  }, (event) => {
  });
})();
```

#### Listen event logs with multiple filter
```javascript
(async () => {
  provider.once('log', {
    network: 'icon:berlin',
    service: 'token',
    event: {
      name: 'Transfer',
      params: [{
        _from: 'btp://0x2.bsc/0x111...'
      }, {
        _from: 'btp://0x3.bsc/0x222...'
      }]
    }
  }, (event) => {
     ...
  }),

  // with service
  service.once('icon:berlin', 'Transfer', [{
    _from: 'btp://0x2.bsc/0x111...'
  }, {
    _from: 'btp://0x3.eth/0x222...'
  }], (event) => {
    ...
  });
})();
```

#### Remove event listener
```javascript
(async () => {
  const listener = (event) => { ... };
  service.on('icon:berlin', 'Transfer', listener);
  service.off('icon:berlin', listener);
})();
```
