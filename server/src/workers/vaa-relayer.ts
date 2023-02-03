import db, { dbAll } from '../database'
import { ccPayAddresses, signers } from '../constants'
import { CCPay__factory } from '../types/contracts'

const watching = new Set<string>()

async function loop() {
	const pending = (await dbAll(
		'SELECT vaa, toChainId FROM Logs WHERE status = 1 AND vaa IS NOT NULL',
	)) as {
		vaa: string
		toChainId: number
	}[]

	for (const { vaa, toChainId } of pending) {
		if (watching.has(vaa)) continue
		watching.add(vaa)

		console.log('vaa', vaa)

		const ccPay = CCPay__factory.connect(ccPayAddresses[toChainId], signers[toChainId])

		ccPay
			.receivePaymentOnTarget(vaa, {
				gasLimit: 2_000_000,
			})
			.then(tx => {
				console.log(tx)
				tx.wait()
			})
			.then(txReceipt => {
				// console.log(txReceipt)
				return new Promise<void>((resolve, reject) => {
					db.run('UPDATE Logs SET status = 1 WHERE vaa = ?', [vaa], () => resolve())
				})
			})
			.then(() => watching.delete(vaa))
			.catch(err => {
				console.log(vaa, err)
				return new Promise<void>((resolve, reject) => {
					db.run('UPDATE Logs SET status = 0 WHERE vaa = ?', [vaa], () => resolve())
				}).finally(() => watching.delete(vaa))
			})
	}

	setTimeout(() => loop(), 3_000) // every 3s
}

loop()
