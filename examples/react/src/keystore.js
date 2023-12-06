const KEYSTORES = {
  ICON_KEYSTORE: {
    "address":"hxbac196fd510c2fd3b85dba41cd43f46dda60a5b6",
    "id":"ac1bacde-e9b5-4557-ade4-3fe8f6c54d73",
    "version":3,
    "coinType":"icx",
    "crypto":{
      "cipher":"aes-128-ctr",
      "cipherparams":{
        "iv":"ec5a09a5edce41f0ed8686f0f68822c3"
      },
      "ciphertext":"e31d084bc0d921923d433c30d2e60580dcf145a1e14f98e2c0b826dbd3624a38",
      "kdf":"scrypt",
      "kdfparams":{
        "dklen":32,
        "n":65536,
        "r":8,
        "p":1,
        "salt":"5d162a5f9945bd9e"
      },
      "mac":"0e2e1eaac4c905effac37285a4f86173678168e6a5ee4bb01b7ec9e84baba929"
    }
  },
  ICON_PASSWORD: 'parameta',
  EVM_KEYSTORE: {
    address: '30db42a61dbf8854979bf6422a5e1f321e5655d1',
    id: '2c53d670-ea10-411b-a06f-1134afcc07f2',
    version: 3,
    Crypto: {
      cipher: 'aes-128-ctr',
      cipherparams: { iv: '37575e7e6fa202c25ed802c0bdae6cf5' },
      ciphertext: '71828d06f15aaa4b34956fcbfcd9fa9b27ceeb1543472a4c2e196c16ea1040e9',
      kdf: 'scrypt',
      kdfparams: {
        salt: '039b217c3ed6ac33e540f215f054f1df758c7abbfa71f390e62f1f6b59b25108',
        n: 131072,
        dklen: 32,
        p: 1,
        r: 8
      },
      mac: 'cdb33c6d61d8e983a8d27419ad956a1b602b8bd9db7a4b3f5406e5c7ecdf36f6'
    }
  },
  EVM_PASSWORD: 'parameta'
}

export default KEYSTORES;
