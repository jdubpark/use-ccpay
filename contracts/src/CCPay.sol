// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.9;

import { IERC20 } from 'oz/token/ERC20/IERC20.sol';
import { ERC20Permit } from 'oz/token/ERC20/extensions/ERC20Permit.sol';
import { SafeERC20 } from 'oz/token/ERC20/utils/SafeERC20.sol';
import { Ownable } from 'oz/access/Ownable.sol';
import { Address } from 'oz/utils/Address.sol';
import { Strings } from 'oz/utils/Strings.sol';
import { ReentrancyGuard } from 'oz/security/ReentrancyGuard.sol';

import { BytesLib } from './libs/BytesLib.sol';
import { Config } from './libs/Config.sol';
import { Storage } from './libs/Storage.sol';
import { LibParam } from './libs/LibParam.sol';
import { LibStack } from './libs/LibStack.sol';
// import { IPlonkVerifier } from './interfaces/IPlonkVerifier.sol';

import { IWormhole } from './Wormhole/IWormhole.sol';
import { ITokenBridge } from './Wormhole/ITokenBridge.sol';
import { BridgeStructs } from './Wormhole/BridgeStructs.sol';

contract CCPay is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using LibParam for bytes32;
    using LibStack for bytes32[];
    using Strings for uint256;
    using BytesLib for bytes;

    address public immutable TOKEN_BRIDGE_ADDRESS;

    address public immutable CORE_BRIDGE_ADDRESS;

    ITokenBridge public immutable TOKEN_BRIDGE;

    address public paymentToken;

    // IWormhole public immutable CORE_BRIDGE;

    uint32 private nonce = 0; // for Wormhole

    // IPlonkVerifier public verifier;

    // bytes32 public merkleRoot;

    // mapping(bytes32 => bool) public nullifierSpent; // for preventing double-spend of commitment

    // uint256 constant SNARK_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    // Payment accrued to a specific commitment (keccak256'ed),
    // which should be invalidated after using the associated nullifier
    // mapping(bytes32 => uint256) public commitmentClaimAmount;

    /**
     *
     * Events
     *
     */

    // NOTE: Don't emit `optionalTag` to keep it private
    event PaymentSent(
        uint16 _recipientChainId,
        bytes32 _recipientContractAddress,
        address _paymentToken,
        uint256 _amount,
        bytes32 _receiptId
    );

    event PaymentReceived(
        uint16 _recipientChainId,
        bytes32 _recipientContractAddress,
        address _paymentToken,
        uint256 _amount,
        bytes32 _receiptId
    );
    
    constructor (
        address _tokenBridgeAddress,
        address _coreBridgeAddress,
        address _paymentTokenAddress
    ) {
        TOKEN_BRIDGE_ADDRESS = _tokenBridgeAddress;
        CORE_BRIDGE_ADDRESS = _coreBridgeAddress;
        TOKEN_BRIDGE = ITokenBridge(_tokenBridgeAddress);
        // CORE_BRIDGE = IWormhole(_coreBridgeAddress);

        paymentToken = _paymentTokenAddress;
    }
    
    /**
     *
     * Execution
     *
     */
    
    /**
     * @dev Payment dispatch function to be called on the source chain by the relayer.
     *      Permit value of the signature is the total transfer amount.
     */
    function makePaymentFromSource(
        address token, // TODO: fixed at USDC
        address owner,
        uint256 permitValue,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,
        // Wormhole-related params
        uint16 recipientChainId,
        bytes32 recipientCCPayAddress, // Wormhole-compatible address
        bytes32 receiptId, // (payload)
        // bytes32 paymentTag, // keccak256 of the commitment
        bytes memory optionalTag
    )
        external
        nonReentrant
        returns (
            uint64 sequence
        )
    {
        // 1. Approval of payment token
        ERC20Permit(token).permit(
            owner,
            address(this),
            permitValue,
            deadline,
            v, r, s
        );

        // 2. Transfer payment token from owner
        require(
            ERC20Permit(token).transferFrom(
                owner,
                address(this),
                permitValue
            ),
            'Transfer failed!'
        );

        // 3. Send payment token to target chain using Wormhole

        // 3a. Check for approval of token from this contract to Wormhole.
        //     If not, approve Wormhole to move token amount to its contract.
        if (IERC20(token).allowance(address(this), TOKEN_BRIDGE_ADDRESS) < permitValue) {
            IERC20(token).approve(TOKEN_BRIDGE_ADDRESS, permitValue);
        }

        // 3b. Assemble payload (message) for Wormhole
        // NOTE: 1. Use `abi.encode` instead of `abi.encodePacked` to avoid tight packing
        //       2. Include optionalTag as the last element of the payload to allow arbitrary size (slice)
        bytes memory payload = _encodePaymentPayload(
            permitValue, // payment amount
            receiptId, // receipt identifier passed from our server
            // paymentTag, // keccak256 of the commitment of the payment
            recipientCCPayAddress, // Wormhole-compatible merchant/receiver address
            optionalTag // optional tag for the receiving contract
        );

        // 3c. Send token to Wormhole with payload
        sequence = TOKEN_BRIDGE.transferTokensWithPayload(
            token,
            permitValue,
            recipientChainId,
            recipientCCPayAddress,
            nonce,
            payload
        );

        emit PaymentSent({
            _recipientChainId: recipientChainId,
            _recipientContractAddress: recipientCCPayAddress,
            _paymentToken: token,
            _amount: permitValue,
            _receiptId: receiptId
        });

        // Final step, prevent double-spend
        nonce += 1;
    }

    /**
     * @dev Payment receive function to be called on the target chain by the relayer
     *          with the encoded VM message from Wormhole.
     */
    function receivePaymentOnTarget(
        bytes memory encodedVm
    )
        external
        nonReentrant
    {
        // 1. Finalize the Wormhole transfer
        BridgeStructs.TransferWithPayload memory vaa = _decodeVaaPayload(
            TOKEN_BRIDGE.completeTransferWithPayload(encodedVm)
        );

        // 2. Decode the payload included in the VM message
        uint256 paymentAmount;
        bytes32 receiptId;
        bytes32 paymentTag;
        bytes memory optionalTag;

        (
            paymentAmount,
            receiptId,
            paymentTag,
            optionalTag
        ) = _decodePaymentPayload(vaa.payload);

        // 3. Checks on payment
        // require(paymentAmount == vaa.amount, 'Payment amount mismatch');

        // 4. Notify the received payment
        emit PaymentReceived({
            _recipientChainId: vaa.tokenChain,
            _recipientContractAddress: vaa.to,
            _paymentToken: _bytes32ToAddress(vaa.tokenAddress),
            _amount: paymentAmount,
            _receiptId: receiptId
        });

        // 5. Pay out the token
        IERC20(_bytes32ToAddress(vaa.tokenAddress))
            .transfer(_bytes32ToAddress(vaa.to), vaa.amount);
        
        // 5. Update payment for commitment
        // commitmentClaimAmount[paymentTag] += paymentAmount;
    }

    /**
     *
     *
     * Merchant/Receiver-related functions
     *
     */

    /// @notice verifies the proof, collects the commitment's accured payment, and prevents this proof from working again.
    // function collectPayment(bytes calldata proof, bytes32 nullifierHash) public {
    //     require(uint256(nullifierHash) < SNARK_FIELD, 'Nullifier is not within the field');
    //     require(!nullifierSpent[nullifierHash], 'Payment already collected');

    //     uint[] memory pubSignals = new uint[](3);
    //     pubSignals[0] = uint256(merkleRoot);
    //     pubSignals[1] = uint256(nullifierHash);
    //     pubSignals[2] = uint256(uint160(msg.sender));
    //     require(verifier.verifyProof(proof, pubSignals), 'Proof verification failed');

    //     nullifierSpent[nullifierHash] = true;
    //     IERC20(paymentToken).transfer(msg.sender, );
    // }
    /**
     *
     * Wormhole-related functions
     *
     */

    function _decodeVaaPayload(bytes memory payload) private pure returns (BridgeStructs.TransferWithPayload memory) {
        BridgeStructs.TransferWithPayload memory decoded = BridgeStructs.TransferWithPayload({
            payloadID: payload.slice(0,1).toUint8(0),
            amount: payload.slice(1,32).toUint256(0),
            tokenAddress: payload.slice(33,32).toBytes32(0),
            tokenChain: payload.slice(65,2).toUint16(0),
            to: payload.slice(67,32).toBytes32(0),
            toChain: payload.slice(99,2).toUint16(0),
            fromAddress: payload.slice(101,32).toBytes32(0),
            payload: payload.slice(133, payload.length-133)
        });

        return decoded;
    }

    function _encodePaymentPayload(
        uint256 permitValue, // payment amount
        bytes32 receiptId, // receipt identifier passed from our server
        // bytes32 paymentTag, // commitment given by the merchant, keccak256()
        bytes32 recipientCCPayAddress, // Wormhole-compatible merchant/receiver address
        bytes memory optionalTag // optional tag for the receiving contract
    ) private pure returns (bytes memory payload) {
        payload = abi.encode(
            permitValue,
            receiptId,
            recipientCCPayAddress,
            optionalTag
        );
    }

    function _decodePaymentPayload(
        bytes memory payload
    ) private pure returns (
        uint256 permitValue, // payment amount
        bytes32 receiptId, // receipt identifier passed from our server
        bytes32 recipientCCPayAddress,
        bytes memory optionalTag // optional tag for the receiving contract
    ) {
        (
            permitValue,
            receiptId,
            recipientCCPayAddress,
            optionalTag
        ) = abi.decode(payload, (uint256, bytes32, bytes32, bytes));
    }

    /**
     *
     * Miscellaneous
     *
     */
    
    function changePaymentToken(address newPaymentToken) public onlyOwner {
        paymentToken = newPaymentToken;
    }
    
    /**
     * @dev Try to convert bytes to address by taking the first 20 hex (assume big-endian).
     */
    function _tryBytesToAddress(bytes memory data) private pure returns (address addr) {
		bytes memory b = data;
		assembly {
			addr := mload(add(b, 20))
		}
	}

    /**
     * @dev Convert Wormhole-compatible bytes32 address to Solidity address.
     */
	function _bytes32ToAddress(bytes32 bys) private pure returns (address) {
		return address(uint160(uint256(bys)));
	}

    /**
     * @dev Convert Solidity address to Wormhole-compatible bytes32 address.
     */
	function _addressToBytes32(address addr) private pure returns (bytes32) {
		return bytes32(uint256(uint160(addr))); // << 96
	}

    /**
     * @dev Try to convert bytes to bytes32 by slicing & loading the first 32 hex.
     */
	function _tryBytesToBytes32(bytes memory bys) private pure returns (bytes32 bys32) {
		if (bys.length == 0) return 0x0;
		assembly {
			bys32 := mload(add(bys, 32))
		}
	}

    /**
     * @notice Direct transfer from EOA should be reverted.
     */
    fallback() external payable {}

    /**
     * @notice Direct transfer from EOA should be reverted.
     */
    receive() external payable {
        require(Address.isContract(msg.sender), 'Not allowed from EOA');
    }
}

