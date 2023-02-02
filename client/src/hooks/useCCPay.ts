import {BigNumber, constants, Contract, providers, utils} from 'ethers'
import {useEffect, useRef, useCallback, useState} from 'react'
import {useAccount, useChainId, useContractRead, useProvider, useSigner} from 'wagmi'
import ERC20PermitNonceABI from "../abis/erc20permit-nonce.json";
import ApiService from "../api";
// import { verifyMessage } from 'ethers/lib/utils'

interface DomainSeparator {
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string,
}

const ERC20ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
]

export interface CCPayProps {
  spender: string,
  tokenName?: string, // optional, if not provided, will be fetched from the contract address (wallet has to be connected to the right chain)
  tokenAddress: string,
  // account: string, // address of the user
  amount: string, // permit amount
  // domainSeparatorVersion: string,
  deadline: string, // permit deadline in ms (after the deadline, permit signature is invalid)
  params: [string, string, string], // params passed onto API
}

interface CCPayMessage {
  owner: string,
  spender: string, // spender of the permit sig (receiving contract)
  value: string,
  nonce: string, // nonce in hex string
  deadline: string,
}

interface CCPayTypedData {
  types: { [typeInterface: string]: { name: string, type: string }[] },
  domain: DomainSeparator,
  primaryType: string,
  message: CCPayMessage,
}

interface CCPaySignedMessaged {
  full: string,
  v: number,
  r: string,
  s: string,
}

const EIP712DomainInterface = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const ERC721PermitInterface = [
  { name: "owner", type: "address" },
  { name: "spender", type: "address" },
  { name: "value", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
];

function splitSignature(signature: string | undefined) {
  if (!signature) return { r: '', s: '', v: 0 }
  if (signature.slice(0, 2) !== '0x') signature = `0x${signature}`
  const split = utils.splitSignature(signature)
  return { r: split.r, s: split.s, v: split.v }
}

async function getTokenName(provider: providers.JsonRpcProvider, address: string): Promise<string> {
  const contract = new Contract(address, ERC20ABI, provider)
  return await contract.name()
}

async function getDecimals(provider: providers.JsonRpcProvider, address: string): Promise<number> {
  const contract = new Contract(address, ERC20ABI, provider)
  return await contract.decimals()
}
async function getDomain(provider: providers.JsonRpcProvider, tokenAddress: string): Promise<DomainSeparator> {
  const [name, chainId] = await Promise.all([
    getTokenName(provider, tokenAddress),
    (await provider.getNetwork()).chainId,
  ]);
  return { name, version: '1', chainId, verifyingContract: tokenAddress }
}

async function getNonce(provider: providers.JsonRpcProvider, tokenAddress: string, account: string) {
  const contract = new Contract(tokenAddress, ERC20PermitNonceABI, provider)
  return (await contract.nonces(account) as BigNumber).toString()
}
const send = (signer: providers.JsonRpcSigner, method: string, params: any[]) => new Promise<any>((resolve, reject) => {
  signer.provider // has to be `provider` for `.send`
    .send(method, params)
    .then((r: any) => resolve(r))
    .catch((e: any) => reject(e))
})
function useCCPay(props: CCPayProps) {
  const provider = useProvider()
  const { data: signer } = useSigner()
  const { address: account } = useAccount()
  const fromChainId = useChainId()
  const { data: tokenName, isError, isLoading } = useContractRead({
    address: utils.isAddress(props.tokenAddress) ? props.tokenAddress : constants.AddressZero,
    abi: ERC20ABI,
    functionName: 'name',
  })

  const message = useRef<CCPayMessage>()
  const typedData = useRef<CCPayTypedData>()

  const [signedMessage, setSignedMessage] = useState<CCPaySignedMessaged>({
    full: '', v: 0, r: '', s: '',
  })
  // NOTE: For this demo, we fix the destination chain to Polygon Mumbai
  const [toChainId] = useState<number>(80001)

  useEffect(() => {
    // console.log(provider, account, tokenName, signer)
    // console.log(account, props.spender, props.tokenAddress)
    if (!provider || !account || !tokenName || !signer) return // props.deadline <= Date.now().toString(16)
    if ([account, props.spender, props.tokenAddress].map(utils.isAddress).includes(false)) return

    const signMessageFn = async () => {
      const amount = utils.parseUnits(
        props.amount,
        await getDecimals(provider as providers.JsonRpcProvider, props.tokenAddress)
      ).toString()
      // console.log(amount)

      message.current = {
        owner: account,
        spender: props.spender, // spender of the permit sig (receiving contract)
        value: amount,
        nonce: await getNonce(provider as providers.JsonRpcProvider, props.tokenAddress, account),
        deadline: props.deadline, // permit signature lifetime
      }

      typedData.current = {
        types: {
          EIP712Domain: EIP712DomainInterface,
          Permit: ERC721PermitInterface,
        },
        domain: await getDomain(provider as providers.JsonRpcProvider, props.tokenAddress),
        primaryType: 'Permit',
        message: message.current,
      }

      // console.log(message, domainSep)
    }

    signMessageFn()
  }, [props, account, tokenName, provider, signer])

  const signMessage = useCallback(async () => {
    console.log('signing message', typedData.current)
    if (!typedData.current || !signer) return

    const typeDataString = JSON.stringify(typedData.current)
    const fromAddress = await signer.getAddress()

    return await send(signer as providers.JsonRpcSigner, 'eth_signTypedData_v4', [fromAddress, typeDataString])
      .then((res: string) => res)
      .catch((error: any) => {
        if (error.message === 'Method eth_signTypedData_v4 not supported.') {
          return send(signer as providers.JsonRpcSigner, 'eth_signTypedData', [fromAddress, typedData.current])
        } else {
          throw error
        }
      })
  }, [typedData, signer])

  const payWithSignature = useCallback(async (inpAddress: string, inpAmount: string, inpOptTag: string, signature: string) => {
    const res = await ApiService.postAcceptSignature({
      payer: account as string,
      paidContractAddress: inpAddress,
      paymentTokenAddress: props.tokenAddress,
      paymentAmount: inpAmount,
      optionalTag: inpOptTag,
      signature,
      fromChainId,
      toChainId,
    })
    console.log(res)
  }, [account, fromChainId, props.tokenAddress, toChainId])

  const doSignAndPay = useCallback(async () => {
    const signedMessageRaw = await signMessage() as string
    if (!signedMessageRaw) return
    console.log(signedMessageRaw)

    setSignedMessage({
      full: signedMessageRaw || '', // concat of v, r, s
      ...splitSignature(signedMessageRaw),
    })

    await payWithSignature(
      ...props.params,
      signedMessageRaw,
    )
  }, [payWithSignature, signMessage, props.params])

  return { signedMessage, doSignAndPay }
}

export default useCCPay
