## Preamble

    Title: Controlled Gluwacoin Standard
    Author: Tae Lim Oh <taelimoh@gluwa.com>
    Type: Standard
    Created: 2020-09-19


## Simple Summary

A standard interface for [Gluwacoin](https://gluwacoin.com) controlled by a centralized operator.


## Abstract

The following standard allows the implementation of a standard API for Gluwacoin operated by a specific controller.
The controller mint Gluwacoin to its account or burn Gluwacoin in its possession.
This standard is Gluwacoin compatible, and, thus, ERC-20 compliant.


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


## Specification

## Token
### Methods

**NOTE**: Callers MUST handle `false` from `returns (bool success)`.
Callers MUST NOT assume that `false` is never returned!

#### Controlled Gluwacoin Methods



##### mint

Creates `amount` tokens to the caller.

**Note** 
- the caller must have a `Controller` role.

``` js
function mint(uint256 amount)
```



##### burn

Destroys `amount` tokens from the caller.

**Note** 
- the caller must have a `Controller` role.

``` js
function burn(uint256 amount)
```



Refer to [Gluwacoin.md](./Gluwacoin.md) for non-Controlled Gluwacoin specific methods and events.

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).