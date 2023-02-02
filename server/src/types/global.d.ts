import { Request, Response, NextFunction } from 'express'

// @ts-expect-error - This is a hack to extend the Request interface
interface TypedRequest<Q = object, B = object> extends Request {
	query: Q
	body: B
}

declare global {
	type ExpReq<Q = object, B = object> = TypedRequest<Q, B>
	type ExpRes = Response
	type ExpNextFn = NextFunction
	type ExpResponseData<T> = {
		opcode: number
		message: string
		data?: T
	}
}
