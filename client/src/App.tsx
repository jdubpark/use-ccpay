import React, {useState} from 'react'
import {Box, Button, Container, OutlinedInput, Stack, Typography, FormControl, InputLabel, InputAdornment} from "@mui/material"
import {ConnectButton} from "@rainbow-me/rainbowkit"
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import MoneyIcon from '@mui/icons-material/Money'
import TagIcon from '@mui/icons-material/Tag';
import {useChainId} from "wagmi";

// @ts-ignore
import homeBgImage from './assets/home-bg.jpg'
import {chainScanners} from "./constants"
import useCCPay from "./hooks/useCCPay"

function App() {
  const chainId = useChainId()

  // const deadline = useRef<number>(Date.now() + 1000 * 60 * 60) // 1 hour

  // NOTE: Input address is always on Polygon/Mumbai because our "hub" liquidity chain is Polygon/Mumbai
  const [inpAddress, setInpAddress] = useState<string>('')
  const [inpAmount, setInpAmount] = useState<string>('100')
  const [inpOptTag, setInpOptTag] = useState<string>('')

  const { signedMessage, doSignAndPay, srcTxHash } = useCCPay({
    tokenName: 'PolygonAtThePit',
    tokenAddress: '0x099d565f84fc902a14ba8aa14241b2814da41fc3', // goerli
    // spender: '0x4ddA6E07f91c7b8a46615a53c162C23245b3010a', // Puller.sol on Goerli
    amount: inpAmount, // permit amount
    deadline: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max Uint256
    params: [inpAddress, inpAmount, inpOptTag],
    relayer: 'http://localhost:8080/api/v1'
  })

  return (
    <Box
      height="100vh"
      width="100vw"
      sx={{
        backgroundImage: `url(${homeBgImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container
        sx={{
          minHeight: '100vh',
          width: '100%',
        }}
      >
        <Stack
          justifyContent="center"
          alignItems="center"
          spacing={4}
          minHeight="100vh"
        >
          <Typography variant="h4" fontWeight="bold">Use Cross-Chain Pay</Typography>
          <Box>
            <ConnectButton showBalance={false} />
          </Box>
          <Box width="100%" maxWidth="550px">
            <FormControl fullWidth sx={{ m: 1 }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-address">Receiving Contract</InputLabel>
              <OutlinedInput
                id="outlined-adornment-address"
                type="text"
                startAdornment={
                  <InputAdornment position="start">
                    <CallReceivedIcon />
                  </InputAdornment>
                }
                label="Receiving Contract"
                placeholder="0x"
                value={inpAddress}
                onChange={(e) => setInpAddress(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth sx={{ m: 1 }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-amount">Payment Amount</InputLabel>
              <OutlinedInput
                id="outlined-adornment-amount"
                type="text"
                startAdornment={
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                }
                label="Payment Amount"
                value={inpAmount}
                onChange={(e) => setInpAmount(e.target.value)}
              />
            </FormControl>
            <FormControl fullWidth sx={{ m: 1 }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-opttag">Optional Tag</InputLabel>
              <OutlinedInput
                id="outlined-adornment-opttag"
                type="text"
                startAdornment={
                  <InputAdornment position="start">
                    <TagIcon />
                  </InputAdornment>
                }
                label="Optional Tag"
                placeholder="wormgang_123"
                value={inpOptTag}
                onChange={(e) => setInpOptTag(e.target.value)}
              />
            </FormControl>
          </Box>
          <Box>
            {/*<RoundButton variant="contained" onClick={doSignMessage}>*/}
            {/*  <Box paddingY={1} paddingX={1} textTransform="capitalize">*/}
            {/*    <Typography variant="body1" fontWeight="bold">Sign Message</Typography>*/}
            {/*  </Box>*/}
            {/*</RoundButton>*/}
            <Button variant="contained" onClick={doSignAndPay}>Sign & Pay</Button>
          </Box>
          <Box>
            {!srcTxHash ?
              <Typography variant="body1">no action</Typography>
              :
              <a href={`${chainScanners[chainId]}/tx/${srcTxHash}`} target="_blank" rel="noopener">
                <Typography variant="body1">
                  {srcTxHash}
                </Typography>
              </a>
            }
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

export default App;
