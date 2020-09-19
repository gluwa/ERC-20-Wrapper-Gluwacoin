## Preamble

    Title: ERC-20 Wrapper Gluwacoin Standard
    Author: Tae Lim Oh <taelimoh@gluwa.com>
    Type: Standard
    Created: 2020-09-14


## Simple Summary

A standard interface for [Gluwacoin](https://gluwacoin.com) backed by 
another [ERC-20](https://eips.ethereum.org/EIPS/eip-20) token.


## Abstract

The following standard allows the implementation of a standard API for Gluwacoin backed by a specific ERC-20 token.
A user can mint a Gluwacoin by depositing the ERC-20 token to the smart contract. You can burn the Gluwacoin and 
withdraw the original ERC-20. This standard is Gluwacoin compatible, and, thus, ERC-20 compliant.


## Motivation

A standard interface to add any ERC-20 token to the Gluwa ecosystem to be re-used by other applications: 
from ETHless transfer and non-custodial exchange.

Gluwacoin Standard has extended on ERC-20 to enhance usability.
ETHless transfer freed users from buying Ether before they can start using a dapp.
Non-custodial exchange functions allow users to make exchange without giving up custody of their fund 
and access a pool of orders instead of taking a whole order at a time.
Again, without buying Ether.
Also, [Gluwa](https://gluwa.com) provides a suite of web services to ease on-boarding,
including [REST API](https://docs.gluwa.com/api/api), 
mobile apps ([iOS](https://apps.apple.com/app/gluwa/id1021292326), [Android](https://play.google.com/store/apps/details?id=com.gluwa.android)), 
and [dashboard](https://dashboard.gluwa.com/).

However, vanilla ERC-20 cannot take advantage of what Gluwa has to offer;
While Gluwacoin is ERC-20 compliant, the reverse is not.

ERC-20 Wrapper Gluwacoin extends the original Gluwacoin standard 
and defines how to wrap any ERC-20 into a Gluwacoin.
Think of ERC-20 as a steam engine train 
and Gluwacoin as an electric train with an overhead line.
ERC-20 Wrapper Gluwacoin is an electric locomotive that turns your train into an electric train.


## Specification

## Token
### Methods

**NOTE**: Callers MUST handle `false` from `returns (bool success)`.
Callers MUST NOT assume that `false` is never returned!

#### ERC-20 Wrapper Gluwacoin Methods



##### token

Returns the address of the base token contract.

``` js
function token() public view returns (address)
```



##### mint

Creates `amount` tokens to the caller, transferring base tokens from the caller to the contract using `transferFrom`.

**Note** 
- the caller must have base tokens of at least `amount`.
- the contract must have allowance for caller's base tokens of at least `amount`.

``` js
function mint(uint256 amount)
```



##### burn

Destroys `amount` tokens from the caller, transferring base tokens from the contract to the caller.

``` js
function burn(uint256 amount)
```


Refer to [Gluwacoin.md](./Gluwacoin.md) for non-Controlled Gluwacoin specific methods and events.

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).