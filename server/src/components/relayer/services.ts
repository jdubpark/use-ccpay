import { getEmitterAddressEth } from '@certusone/wormhole-sdk'
import crypto from 'crypto'
import { BigNumber, constants, Contract, ethers, utils } from 'ethers'

import { acceptSignatureBody, deliverVaaBody } from '../../types/request/relayer'
import { CCPay__factory } from '../../types/contracts'
import permitABI from '../../scripts/erc20permit-abi.json'
import { ccPayAddresses, signers, wormholeChainIds } from '@bhcs/constants'

export default class RelayerServices {
	static async acceptSignature(params: acceptSignatureBody): Promise<ethers.ContractReceipt> {
		const {
			payer,
			paidContractAddress,
			paymentTokenAddress,
			paymentAmount,
			optionalTag,
			signature: sigFull,
			fromChainId,
			toChainId,
		} = params

		// const whFromChainId = wormholeChainIds[fromChainId]
		const whToChainId = wormholeChainIds[toChainId]

		const sig = utils.splitSignature(sigFull)

		// Grab the decimals for payment token decimal precision
		const token = new Contract(paymentTokenAddress, permitABI, signers[fromChainId])
		const decimals = (await token.decimals()) as number

		const ccPay = CCPay__factory.connect(ccPayAddresses[fromChainId], signers[fromChainId])
		const receiptId = crypto
			.createHash('sha256')
			.update(`${payer}${fromChainId}${paymentAmount}${sigFull}`)
			.digest('hex')

		// decimal precision multiplication is done server-side
		const paymentAmountAdj = BigNumber.from(10).pow(decimals).mul(paymentAmount).toString()

		const tx = await ccPay.makePaymentFromSource(
			paymentTokenAddress, // TODO: fixed at USDC
			payer,
			paymentAmountAdj,
			constants.MaxUint256,
			sig.v,
			sig.r,
			sig.s,
			// Wormhole-related params
			whToChainId,
			`0x${getEmitterAddressEth(paidContractAddress)}`, // Wormhole-compatible address
			`0x${receiptId}`,
			optionalTag || '0x',
			{
				gasLimit: 2_000_000,
			},
		)

		console.log('tx', tx.hash)
		const txReceipt = await tx.wait()
		// console.log(txReceipt)

		return txReceipt
	}

	static async deliverVaa(params: deliverVaaBody): Promise<ethers.ContractReceipt> {
		const { vaa, toChainId } = params
		console.log('vaa', vaa)
		console.log('toChainId', toChainId)
		console.log(ccPayAddresses[toChainId])

		const ccPay = CCPay__factory.connect(ccPayAddresses[toChainId], signers[toChainId])
		const tx = await ccPay.receivePaymentOnTarget(vaa, {
			gasLimit: 2_000_000,
		})

		console.log('tx', tx.hash)
		const txReceipt = await tx.wait()
		// console.log(txReceipt)

		return txReceipt
	}
}
