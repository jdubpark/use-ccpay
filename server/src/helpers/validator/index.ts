import { utils } from 'ethers'
import { CustomHelpers } from 'joi'

export const validateAddress = (possibleAddress: string, helper: CustomHelpers) => {
	const isAddress = utils.isAddress(possibleAddress)
	if (isAddress) {
		return true
	} else {
		return helper.error('Invalid address')
	}
}
