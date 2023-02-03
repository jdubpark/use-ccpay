import { providers } from 'ethers'
import { ccPayAddresses } from '../constants'
import { CCPay__factory } from '../types/contracts'

async function main() {
	const provider = new providers.JsonRpcProvider('https://rpc.ankr.com/polygon_mumbai')

	const observedAddress = ccPayAddresses[80001]

	const ccPay = CCPay__factory.connect(observedAddress, provider)

	const filter = ccPay.filters.PaymentReceived()

	const interval = 100

	provider.on('block', async (blockNumber: number) => {
		if (blockNumber % interval !== 0) return

		const events = await ccPay.queryFilter(filter, blockNumber - interval, blockNumber)

		events.forEach(event => {
			const { args } = event
			console.log(args)
		})
	})
}

main()
