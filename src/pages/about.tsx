import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import AppBar from '../components/AppBar'

export default function About() {
  return (
    <div>
      <AppBar />
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            scenery.cx
        </Typography>
      High quality scenery art.
        <br />
        </Box>
      </Container>
    </div>
  )
}