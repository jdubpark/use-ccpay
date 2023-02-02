import axios from 'axios'
import { ethers, utils } from 'ethers'
import { getEmitterAddressEth, parseSequenceFromLogEth } from '@certusone/wormhole-sdk'

import { signers, whBridgeAddresses, wormholeChainIds, wormholeRestAddress } from '../constants'
import { FetchVaa } from '../types/services/relayer'

async function fetchVaaAttempt(
	url: string,
	attempt: number,
	maxAttempts: number,
	attemptInterval = 90000,
): Promise<{ vaaBytes: string }> {
	if (attempt > maxAttempts) throw new Error('VAA not found!')
	await new Promise(r => setTimeout(r, attemptInterval))
	try {
		const { data } = await axios.get<FetchVaa>(url)
		if (data.code === 5 || data.message === 'requested VAA not found in store')
			throw new Error('VAA not found')
		return data as { vaaBytes: string }
	} catch (err) {
		console.log(`VAA attempt failed (${attempt}/${maxAttempts})`)
		attempt += 1
		// Increase the wait interval after every attempt.
		return fetchVaaAttempt(url, attempt, maxAttempts, attempt ** (5 / 3) * attemptInterval)
	}
}

// NOTE: Finality on Ethereum & Polygon is about 15 minutes when using Portal, for both mainnets and testnets
async function fetchVaa(fromChainId: number, tx: ethers.ContractReceipt) {
	const logMatchAddress = whBridgeAddresses[fromChainId].core
	const seq = parseSequenceFromLogEth(tx, logMatchAddress)
	const emitterAddr = getEmitterAddressEth(whBridgeAddresses[fromChainId].token)
	const whFromChainId = wormholeChainIds[fromChainId]

	console.log(
		'Searching for: ',
		`${wormholeRestAddress}/v1/signed_vaa/${whFromChainId}/${emitterAddr}/${seq}`,
	)

	// await new Promise(r => setTimeout(r, 5000)) // wait for Guardian to pick up message

	const vaaPickUpUrl = `${wormholeRestAddress}/v1/signed_vaa/${whFromChainId}/${emitterAddr}/${seq}`
	const maxAttempts = 10
	const attemptInterval = 10000 // 10s
	const attempt = 0

	const { vaaBytes } = await fetchVaaAttempt(vaaPickUpUrl, attempt, maxAttempts, attemptInterval)
	return utils.hexlify(Buffer.from(vaaBytes, 'base64')) // vaa bytes converted to hex (passed as param)
}

async function main() {
	const fromChainId = 5
	const txHash = '0x3450a05e5384ea3ffb6b03ef0532b2bc53bde9353225a7f765a1f3b7df1d33c1'
	const receipt = await signers[fromChainId].provider.getTransactionReceipt(txHash)

	if (!receipt) throw new Error('No receipt found')

	const vaa = await fetchVaa(5, receipt)
	console.log('vaa', vaa)
}

main()
