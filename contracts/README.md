# Blockhouse Contracts Monorepo

Foundry forge setup.

```bash
make
make test
```

Deployment
```bash
cp .env.example .env # fill out the variables
make deploy-goerli contract=Token
```

For finding the storage slot # of `balanceOf` for manipulating token amount, use [slot20.js](https://github.com/kendricktan/slot20) as such:
```bash
CONTRACT=0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d \
WALLET=0x66D5eEaFbb36B976967B9C2f0FceAA18B339A64C \
RPC=https://rpc.ankr.com/eth_goerli \
./slot20.js balanceOf $CONTRACT $WALLET --rpc $RPC -v
```

NOTE: Make sure to use `WALLET` address that has some token on Goerli already. Otherwise the slot will return `-1`.

## Deployments

CCPay.sol
Goerli: 0x8da84e7D72D8F786b05c0DDE9f0a15389372a0BE
Mumbai: 0xD4278889A1a2307356D6C220C88785e5d34F1d44

PIT Token
Goerli: 0x099D565f84fc902a14BA8aa14241B2814da41Fc3