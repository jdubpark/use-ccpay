// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.9;

interface IInstaEngine {
    function receiveAndExecute(
        bytes calldata encodedVaa
    ) external returns (uint256 amountOut);
}
