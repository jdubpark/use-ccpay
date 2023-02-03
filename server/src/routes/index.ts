import { celebrate } from 'celebrate'
import { Router } from 'express'

import { RelayerController, RelayerValidator } from '../components/relayer'

const router = Router()

/**
 * Relayer
 */
router.post(
	'/relayer/accept-signature',
	// celebrate(RelayerValidator.acceptSignature),
	RelayerController.acceptSignature,
)

// router.post(
// 	'/relayer/deliver-vaa',
// 	// celebrate(RelayerValidator.deliverVaa),
// 	RelayerController.deliverVaa,
// )

export default router
