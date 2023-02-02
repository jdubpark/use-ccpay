import axios from 'axios'

export interface PostAcceptSignatureParams {
  payer: string
  paidContractAddress: string
  paymentTokenAddress: string
  paymentAmount: string
  optionalTag: string
  signature: string
  fromChainId: number
  toChainId: number
}

export default class ApiService {
  static baseUrl = 'http://localhost:8080'
  static async postAcceptSignature(params: PostAcceptSignatureParams) {
    const { data } = await axios.post(ApiService._getApiUrl('/relayer/accept-signature'), params)
    return data
  }

  static _getApiUrl(path: string): string {
    return `${this.baseUrl}/api/v1${path}`
  }
}
