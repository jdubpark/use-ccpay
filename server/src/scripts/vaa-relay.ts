import { CCPay__factory } from '../types/contracts'
import { ccPayAddresses, signers } from '../constants'
async function main() {
	const toChainId = 80001 // Mumbai

	const vaa =
		'0x010000000001004159932090263cc88c34cb99197669cc4d33476ab8c0fab1e8c36dfcfe23cd7160c8f3494a0ffeddf9a00a6ba2e7dba57901b4ceb7ad0d1359d3215b4896a02c0163dc6800000000040002000000000000000000000000f890982f9310df57d00f659cf4fd87e65aded8d70000000000000d36010300000000000000000000000000000000000000000000000000000002540be400000000000000000000000000099d565f84fc902a14ba8aa14241b2814da41fc3000200000000000000000000000024c1b2eb3cce1adc9a66da2607a6d7d32f011ddb00050000000000000000000000005b109922066792a96fe3ffc20af19d98aef1efb00000000000000000000000000000000000000000000000056bc75e2d63100000168ac3728b9ba75f76a4e8a08eafce6318afb0f1737076e2dcdeba8915fb7a9c00000000000000000000000024c1b2eb3cce1adc9a66da2607a6d7d32f011ddb000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000046c6d616f00000000000000000000000000000000000000000000000000000000'

	const ccPay = CCPay__factory.connect(ccPayAddresses[toChainId], signers[toChainId])

	const tx = await ccPay.receivePaymentOnTarget(vaa, {
		gasLimit: 2_000_000,
	})

	console.log(tx.hash)
	const receipt = await tx.wait()
	console.log(receipt)
}

main()
