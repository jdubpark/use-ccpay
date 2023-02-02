import { Button } from '@mui/material'
import { styled } from '@mui/material/styles'

export default styled(Button)(({ theme }) => ({
  position: 'relative',
  // height: 200,
  color: '#fff',
  backgroundColor: '#333',
  borderRadius: 50,
  // [theme.breakpoints.down('sm')]: {
  //   width: '100% !important', // Overrides inline-style
  //   height: 100,
  // },
  '&:hover': {
    backgroundColor: '#444',
  },
}))
