// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.9;

interface IInstaIndex {
    function build(
        address _owner,
        uint256 _accountVersion,
        address _origin
    ) external returns (address _account);
}
