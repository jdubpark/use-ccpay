import HttpStatus, { OK } from 'http-status/lib'

import { ApiSuccessResponse } from '../types/response'

const apiResponse = <T>(data?: T): ApiSuccessResponse<T> => {
	return {
		status: OK,
		message: HttpStatus[OK] as string,
		data,
	}
}

export default apiResponse
