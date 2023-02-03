/**
 * Take pending VAA requests on database/redis and observe the Wormhole REST API
 * until the VAA is found. For each VAA found, update the database/redis to remove that
 * request for VAA observation, and emit an event picked up by vaa-relayer.ts that
 * relays the confirmed VAA to the destination chain (Polygon) contract.
 */

import axios from 'axios'
import { ethers, utils } from 'ethers'
import { getEmitterAddressEth, parseSequenceFromLogEth } from '@certusone/wormhole-sdk'

import db, { dbAll } from '../database'
import { signers, whBridgeAddresses, wormholeChainIds, wormholeRestAddress } from '../constants'
import { FetchVaa } from '../types/services/relayer'

async function fetchVaaAttempt(
	url: string,
	attempt: number,
	maxAttempts: number,
	attemptInterval = 10_000,
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
		return fetchVaaAttempt(url, attempt, maxAttempts, attemptInterval)
	}
}

// NOTE: Finality on Ethereum & Polygon is about 15 minutes when using Portal, for both mainnets and testnets
async function fetchVaa(fromChainId: number, tx: ethers.ContractReceipt) {
	const logMatchAddress = whBridgeAddresses[fromChainId].core
	const seq = parseSequenceFromLogEth(tx, logMatchAddress)
	const emitterAddr = getEmitterAddressEth(whBridgeAddresses[fromChainId].token)
	const whFromChainId = wormholeChainIds[fromChainId]
	console.log(logMatchAddress, seq, emitterAddr)

	console.log(
		'Searching for: ',
		`${wormholeRestAddress}/v1/signed_vaa/${whFromChainId}/${emitterAddr}/${seq}`,
	)

	// await new Promise(r => setTimeout(r, 5000)) // wait for Guardian to pick up message

	const vaaPickUpUrl = `${wormholeRestAddress}/v1/signed_vaa/${whFromChainId}/${emitterAddr}/${seq}`
	const maxAttempts = 250
	const attemptInterval = 10_000 // 10s
	const attempt = 0

	const { vaaBytes } = await fetchVaaAttempt(vaaPickUpUrl, attempt, maxAttempts, attemptInterval)
	return utils.hexlify(Buffer.from(vaaBytes, 'base64')) // vaa bytes converted to hex (passed as param)
}

const watching = new Set<string>()

async function loop() {
	const pending = (await dbAll(
		'SELECT txHash, fromChainId FROM Logs WHERE status = 2 OR vaa IS NULL',
	)) as {
		txHash: string
		fromChainId: number
	}[]
	// console.log(await dbAll('SELECT * FROM Logs WHERE status = 2 OR vaa IS NULL'))

	for (const { txHash, fromChainId } of pending) {
		if (watching.has(txHash)) continue
		watching.add(txHash)

		const receipt = await signers[fromChainId].provider.getTransactionReceipt(txHash)

		if (!receipt) {
			db.run('UPDATE Logs SET status = 0 WHERE txHash = ?', [txHash], () => watching.delete(txHash))
			continue
		}
		// console.log(txHash, receipt)

		fetchVaa(fromChainId, receipt)
			.then(vaa => {
				db.run('UPDATE Logs SET status = 1, vaa = ? WHERE txHash = ?', [vaa, txHash], () =>
					watching.delete(txHash),
				)
			})
			.catch(err => {
				db.run('UPDATE Logs SET status = 0 WHERE txHash = ?', [txHash], () =>
					watching.delete(txHash),
				)
			})
	}

	setTimeout(() => loop(), 3_000) // every 3s
}

loop()
