import { OK } from 'http-status/lib'

import RelayerServices from './services'
import { apiResponse } from '../../helpers'
import { acceptSignatureBody, deliverVaaBody } from '../../types/request/relayer'

export default class RelayerController {
	static acceptSignature = async (
		req: ExpReq<null, acceptSignatureBody>,
		res: ExpRes,
		next: ExpNextFn,
	) => {
		try {
			// const { paidContractAddress, paymentAmount, optionalTag } = req.body
			const receipt = await RelayerServices.acceptSignature(req.body)

			res.status(OK).json(apiResponse(receipt))
		} catch (error) {
			next(error)
		}
	}

	static deliverVaa = async (req: ExpReq<null, deliverVaaBody>, res: ExpRes, next: ExpNextFn) => {
		try {
			// const { vaa, toChainId } = req.body
			const receipt = await RelayerServices.deliverVaa(req.body)

			res.status(OK).json(apiResponse(receipt))
		} catch (error) {
			next(error)
		}
	}
}
