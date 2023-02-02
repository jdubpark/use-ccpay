// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.9;

import { Script } from 'forge-std/Script.sol';
import { console } from 'forge-std/console.sol';

import { CCPay } from '../src/CCPay.sol';

contract DeployCCPay is Script {
  CCPay internal ccpay;

	uint256 internal chainGoerli = 5;
	// uint256 internal chainRopsten = 3;
  uint256 internal chainMumbai = 80001;
	uint256 internal chainFuji = 43113;

	function run() public {
		address tokenBridgeAddress;
		address coreBridgeAddress;

		console.log(block.chainid);
		(tokenBridgeAddress, coreBridgeAddress) = _loadWormholeAddresses();
		address paymentToken = _loadPITAddress();

		vm.startBroadcast();
		ccpay = new CCPay(
			tokenBridgeAddress,
			coreBridgeAddress,
			paymentToken
		);
		vm.stopBroadcast();
	}

	function _loadWormholeAddresses()
		internal
		view
    returns (address tokenBridgeAddress, address coreBridgeAddress)
  {
    // NOTE: for V3, most addresses are the same across chains
    if (block.chainid == chainGoerli) {
			tokenBridgeAddress = 0xF890982f9310df57d00f659cf4fd87e65adEd8d7;
      coreBridgeAddress = 0x706abc4E45D419950511e474C7B9Ed348A4a716c;
    } else if (block.chainid == chainMumbai) {
			tokenBridgeAddress = 0x377D55a7928c046E18eEbb61977e714d2a76472a;
			coreBridgeAddress = 0x0CBE91CF822c73C2315FB05100C2F714765d5c20;
    } else {
      revert('Unsupported chain');
    }
  }

	function _loadPITAddress() internal view returns (address token) {
		if (block.chainid == chainGoerli) {
			token = 0x099D565f84fc902a14BA8aa14241B2814da41Fc3; // main deployed PIT
		} else if (block.chainid == chainMumbai) {
			// token = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
		} else {
			revert('Unsupported chain');
		}
	}
}