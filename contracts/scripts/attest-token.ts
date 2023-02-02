import { attestFromEth, getEmitterAddressEth, parseSequenceFromLogEth, tryNativeToHexString } from '@certusone/wormhole-sdk'
import axios from 'axios'
import dotenv from 'dotenv'
import { Wallet, providers, Contract } from 'ethers'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })

const whTokenBridgeABI = [
	{
		'inputs': [
			{
				'internalType': 'bytes',
				'name': 'encodedVm',
				'type': 'bytes'
			}
		],
		'name': 'createWrapped',
		'outputs': [
			{
				'internalType': 'address',
				'name': 'token',
				'type': 'address'
			}
		],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'inputs': [
			{
				'internalType': 'uint16',
				'name': 'tokenChainId',
				'type': 'uint16'
			},
			{
				'internalType': 'bytes32',
				'name': 'tokenAddress',
				'type': 'bytes32'
			}
		],
		'name': 'wrappedAsset',
		'outputs': [
			{
				'internalType': 'address',
				'name': '',
				'type': 'address'
			}
		],
		'stateMutability': 'view',
		'type': 'function'
	}
]

// From: https://github.com/wormhole-foundation/xdapp-book/blob/main/src/development/portal/evm/attestingToken.md

async function fetchVaa(vaaURL: string): Promise<{ vaaBytes: string | undefined }> {
	return axios.get(vaaURL).then((res) => res.data as { vaaBytes: string }).catch(() => ({ vaaBytes: undefined }))
}

async function main() {
	const _signer = new Wallet(process.env.PRIVATE_KEY as string)

	const signerGoerli = _signer.connect(new providers.JsonRpcProvider('https://rpc.ankr.com/eth_goerli'))
	const signerMumbai = _signer.connect(new providers.JsonRpcProvider('https://rpc.ankr.com/polygon_mumbai'))

	// Goerli testnet bridge address
	const fromTokenBridge = '0xF890982f9310df57d00f659cf4fd87e65adEd8d7'
	const fromCoreBridge = '0x706abc4E45D419950511e474C7B9Ed348A4a716c'
	const fromWhChainId = 2 // Wormhole-compatible Goerli

	// Mumbai testnet bridge address
	const toTokenBridge = '0x377D55a7928c046E18eEbb61977e714d2a76472a'

	// Goerli testnet token address (PIT token)
	// NOTE: token to attest
	const testTokenAddress = '0x099D565f84fc902a14BA8aa14241B2814da41Fc3'

	const wormholeRestAddress = `https://wormhole-v2-testnet-api.certus.one` // `https://wormhole-v2-mainnet-api.certus.one`
	
	/*
	const networkTokenAttestation = await attestFromEth(
		fromTokenBridge,
		signerGoerli,
		testTokenAddress
	)

	console.log(networkTokenAttestation)

	const emitterAddr = getEmitterAddressEth(fromTokenBridge)
	const seq = parseSequenceFromLogEth(networkTokenAttestation, fromCoreBridge)
	const vaaURL = `${wormholeRestAddress}/v1/signed_vaa/${fromWhChainId}/${emitterAddr}/${seq}`
	*/

	const vaaURL = 'https://wormhole-v2-testnet-api.certus.one/v1/signed_vaa/2/000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d7/3370'
	console.log('Searching for: ', vaaURL)

	let vaaBytes = await fetchVaa(vaaURL)

	while (!vaaBytes.vaaBytes) {
			console.log('VAA not found, retrying in 5s!')
			await new Promise((r) => setTimeout(r, 5000))
			vaaBytes = await fetchVaa(vaaURL)
	}

	const targetTokenBridge = new Contract(
		toTokenBridge,
		whTokenBridgeABI,
		signerMumbai
	)

	await targetTokenBridge.createWrapped(
		Buffer.from(vaaBytes.vaaBytes, 'base64'),
		{ gasLimit: 2_000_000 },
	)

	await new Promise((r) => setTimeout(r, 5000)) //Time out to let block propogate

	const wrappedTokenAddress = await targetTokenBridge.wrappedAsset(
		fromWhChainId,
			Buffer.from(
					tryNativeToHexString(testTokenAddress, 'ethereum'),
					'hex'
			)
	);
	console.log('Wrapped token created at: \t', wrappedTokenAddress);

	// PIT from Goerli attested on Mumbai
	// https://mumbai.polygonscan.com/tx/0x453f8d63d43058bb7b642117d049cef1f98fe0021cd330d3e5a3424734bbcaa9
}

main()