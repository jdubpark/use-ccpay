import { Contract, Wallet, utils, providers, BigNumber } from 'ethers'
import dotenv from 'dotenv'
import * as path from 'path'

import permitABI from './erc20permit-abi.json'
import pullerABI from './puller-abi.json'
import * as process from 'process'

dotenv.config({ path: path.join(__dirname, '../../.env') })

async function main() {
	// const RPC_ENDPOINT = 'https://rpc.ankr.com/polygon_mumbai'
	const RPC_ENDPOINT = 'https://rpc.ankr.com/eth_goerli'
	const provider = new providers.JsonRpcProvider(RPC_ENDPOINT)
	const signer = new Wallet(process.env.PRIVATE_KEY as string, provider)

	// const tokenAddress = '0xd7017C8539eB3e8a291bDaC171F17ACe41FD567F' // PIT on Mumbai
	// const pullerAddress = '0xEF2774d2F33A9cB8Ae3c6A48Bb88E748529d6b85' // Puller.sol on Mumbai
	const tokenAddress = '0x099d565f84fc902a14ba8aa14241b2814da41fc3' // PIT on Goerli
	const pullerAddress = '0x4ddA6E07f91c7b8a46615a53c162C23245b3010a' // Puller.sol on Goerli

	const token = new Contract(tokenAddress, permitABI, signer)

	const puller = new Contract(pullerAddress, pullerABI, signer)

	const deadline = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

	// const { v: sigV, r: sigR, s: sigS } = utils.splitSignature(permitSig)
	// console.log(sigV, sigR, sigS)
	const sigR = '0xc7e1503f9b6b9ec17b55b0ac46fc6831f94abf7fbc943600a62e2d31f5163bd2'
	const sigS = '0x0d1881b7ab991505da26546469f88e3c6024ed117c22a14b9e104ce2ee615950'
	const sigV = 28

	const decimals = (await token.decimals()) as number

	const permitAmount = '100'

	// const tx: providers.TransactionResponse = await token.permit(
	// 	'0x91411c9CE861b8F63e53458DA28F0A2DFE702eE3',
	// 	pullerAddress,
	// 	'100000000000000000000',
	// 	deadline,
	// 	sigV,
	// 	sigR,
	// 	sigS,
	// 	{ gasLimit: 3_000_000 },
	// )
	// console.log(tx.hash)
	// const receipt = await tx.wait()
	// console.log(receipt)

	const pullTx: providers.TransactionResponse = await puller.pull(
		tokenAddress,
		'0x91411c9CE861b8F63e53458DA28F0A2DFE702eE3',
		BigNumber.from(10).pow(decimals).mul(permitAmount).toString(),
		1_000_000,
		deadline,
		sigV,
		sigR,
		sigS,
		{ gasLimit: 3_000_000 },
	)
	console.log(pullTx.hash)

	const receipt = await pullTx.wait()
	console.log(receipt)
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})
