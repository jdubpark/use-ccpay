import { Joi, Segments } from 'celebrate'

import { validateAddress } from '../../helpers/validator'

export const acceptSignature = {
	[Segments.BODY]: Joi.object().keys({
		paidContractAddress: Joi.string().custom(validateAddress).required(),
		paymentAmount: Joi.string().required(),
		optionalTag: Joi.string().optional(),
		signature: Joi.string().required(),
	}),
	// [Segments.QUERY]: {
	// 	token: Joi.string().token().required(),
	// },
}
