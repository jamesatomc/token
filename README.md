## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

```shell
forge create src/TokenFactory.sol:TokenFactory  --rpc-url https://tea-sepolia.g.alchemy.com/public --ledger --broadcast  --gas-limit 368036
[⠊] Compiling...
No files changed, compilation skipped
Deployer: 0xC88C539aa6f67daeDaeA7aff75FE1F8848d6CeC2
Deployed to: 0xd6DCfc021E526C483982161f36CE6692fdef9E04
Transaction hash: 0x40107040f112ae298e15143d338fec36423a9517e1c37bee3d52a24eab32a105
```