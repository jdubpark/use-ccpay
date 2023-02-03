import { providers, Wallet } from 'ethers'

import config from '../config'
export const wormholeRestAddress = `https://wormhole-v2-testnet-api.certus.one` // `https://wormhole-v2-mainnet-api.certus.one`
export const whBridgeAddresses: { [chainId: number]: { [type: string]: string } } = {
	5: {
		token: '0xF890982f9310df57d00f659cf4fd87e65adEd8d7',
		core: '0x706abc4E45D419950511e474C7B9Ed348A4a716c',
	},
	80001: {
		token: '0x377D55a7928c046E18eEbb61977e714d2a76472a',
		core: '0x0CBE91CF822c73C2315FB05100C2F714765d5c20',
	},
}

export const ccPayAddresses: { [chainId: number]: string } = {
	5: '0x5B109922066792a96Fe3FFC20af19D98AEf1efB0',
	80001: '0x24c1B2EB3ccE1aDC9A66dA2607a6d7D32F011DDB',
}

export const wormholeChainIds: { [chainId: number]: number } = {
	5: 2, // Goerli
	80001: 5, // Mumbai
}

export const signers: { [chainId: number]: Wallet } = {
	5: new Wallet(
		config.WEB3.PRIVATE_KEY,
		new providers.JsonRpcProvider('https://rpc.ankr.com/eth_goerli'),
	),
	80001: new Wallet(
		config.WEB3.PRIVATE_KEY,
		new providers.JsonRpcProvider('https://rpc.ankr.com/polygon_mumbai'),
	),
}
