import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import AppBar from '../../components/AppBar'
import { makeStyles } from 'tss-react/mui';
import Paper from '@mui/material/Paper'

const useStyles = makeStyles()(() => ({
  api_route: {
    padding: 5,
    marginTop: 10,
    width: "fit-content!important"
  }
}));

export default function Api() {
  const { classes } = useStyles()
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
            <h4>{`Get image info - GET ${process.env.api_domain}/get_image_info/{IMAGE_ID}`}</h4>
            <h4>Returns json with information about an image</h4>
          </Paper>
        </Box>
      </Container>
    </div>
  )
}