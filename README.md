# Gluwacoin

Interoperable Stablecoin Standard

## What is Gluwacoin?

Gluwacoin is an interoperable stablecoin standard. The standard has built-in functions to enable exchange with other cryptocurrencies, which connects its ecosystem to other blockchains. We have implemented the system to support the ERC20 standard on the Ethereum network. The implementation includes security features, compliance features, and upgrade features that provide the desired level of security and elasticity.

The Gluwacoin Trust proposed the standard. This repository is the official implementation of the Gluwacoin standard by Gluwa.

For more information, see [https://gluwacoin.com](https://gluwacoin.com), or read the [original whitepaper](https://gluwacoin.com/white-paper).

## Setup

### Installing Dependencies

```commandline
$ npm install
```

#### Installing OpenZeppelin
```commandline
$ npm install @openzeppelin/cli
```

#### Initializing the openzeppelin project
```commandline
$ npx oz init
```

#### Linking the Contracts Ethereum Package

You need this for local testing. We will use a preset of ERC20 to use as a base token for the ERC-20 Wrapper Gluwacoin.

```commandline
$ npx oz link @openzeppelin/contracts-ethereum-package
```

#### Run a local testnet

Let’s deploy an ERC20 token contract to our development network.
Make sure to have a Ganache instance running, or start one by running:
```commandline
$ npx ganache-cli --deterministic
```
Note that the current version of Ganache does not work on `Node 14`.
I am using `Node 12`.
https://github.com/trufflesuite/ganache-cli/issues/732

#### Deploy ERC20 token
```commandline
% npx oz deploy

Nothing to compile, all contracts are up to date.
? Choose the kind of deployment regular
? Pick a network development
? Pick a contract to deploy @openzeppelin/contracts-ethereum-package/ERC20PresetMinterPauserUpgradeSafe
✓ Deployed instance of ERC20PresetMinterPauserUpgradeSafe
All implementations are up to date
? Call a function to initialize the instance after creating it? Yes
? Select which function initialize(name: string, symbol: string)
? name: string: Token
? symbol: string: T
✓ Instance created at [ADRESS OF THE CONTRACT]
To upgrade this instance run 'oz upgrade'
[ADRESS OF THE CONTRACT]
```

#### Deploy ERC20Wrapper token
```commandline
$ npx oz deploy
Nothing to compile, all contracts are up to date.
? Choose the kind of deployment upgradeable
? Pick a network development
? Pick a contract to deploy ERC20WrapperGluwacoin
All implementations are up to date
? Call a function to initialize the instance after creating it? Yes
? Select which function initialize(name: string, symbol: string, decimals: uint8, token: address)
? name: string: Gluwacoin
? symbol: string: G
? decimals: uint8: 18
? token: address: [ADRESS OF THE CONTRACT]
✓ Instance created at [ADRESS OF THE GLUWACOIN CONTRACT]
To upgrade this instance run 'oz upgrade'
[ADRESS OF THE GLUWACOIN CONTRACT]
```

