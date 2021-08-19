import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import AppBar from '../../components/AppBar'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'

const useStyles = makeStyles(() => ({
  api_route: {
    padding: 5,
    marginTop: 10,
    width: "fit-content!important"
  }
}))

export default function Api() {
  const classes = useStyles()
  return (
    <div>
      <AppBar />
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            API
        </Typography>
          <Paper className={classes.api_route}>
            <h3>Get image info</h3>
            <h4>{`Get all images - GET ${process.env.api_domain}/image/{IMAGE_ID}`}</h4>
            <h4>Returns json with information about an images</h4>
          </Paper>
        </Box>
      </Container>
    </div>
  )
}