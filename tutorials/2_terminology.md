### BTP SDK Server

### Provider (BTPProvider)
A `Provider` provides a connection to btpsdk-server, which can be used to query its current state, and send transactions to update the state.

### Service
A `Service` communicates with deployed smart contract on the multiple blockchains, and provides a simple Javascript interface to call methods, send transaction and listen for its events.

### Contract
A `Contract` communicates with a deployed smart contract on the blockchain, and provides a simple Javascript interface to call methods, send transaction and listen for its events.

### Signer
A `Signer` represents an account on the blockchain. when interacting with `Service` or `Contract`, it is necessary to use a private key authenticate actions by signing a payload
