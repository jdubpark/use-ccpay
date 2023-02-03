export enum WormholeCoreBridge {
  GOERLI = '0x706abc4E45D419950511e474C7B9Ed348A4a716c',
  MUMBAI = '0x0CBE91CF822c73C2315FB05100C2F714765d5c20',
}

export enum WormholeTokenBridge {
  GOERLI = '0xF890982f9310df57d00f659cf4fd87e65adEd8d7',
  MUMBAI = '0x377D55a7928c046E18eEbb61977e714d2a76472a',
}

export enum CCPayChain {
  GOERLI = 5,
  MUMBAI = 80001,
}

export const CCPayContract: { [key in CCPayChain]: string } = {
  5: '0x877E81000471c7297e4405366cDC30b23B728661',
  80001: '0xca92f55a294e41d9085258ccb5e203440fd32a85',
}

export const CCPayChainReverse: { [key: string]: CCPayChain } = {
  5: CCPayChain.GOERLI,
  80001: CCPayChain.MUMBAI,
}
