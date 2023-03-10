export interface acceptSignatureBody {
	payer: string
	receiver: string
	ccPayAddress: string
	paymentTokenAddress: string
	paymentAmount: string
	optionalTag: string
	signature: string
	fromChainId: number
	toChainId: number
}

export interface deliverVaaBody {
	vaa: string
	toChainId: number
}
