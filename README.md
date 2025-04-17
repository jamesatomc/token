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
Deployed to: 0x1e8c007A328701fDc34761990CAae81359698CB7
Transaction hash: 0x16ee155095055bfabe8f8acaaa3c2c00b38413e5e9eba225bd6d2845d17e40b5
```