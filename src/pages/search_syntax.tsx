import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import AppBar from '../components/AppBar'
import Link from './../components/Link'

export default function SearchSyntax() {
  return (
    <div>
      <AppBar />
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search syntax
        </Typography>
        Available logical operators: && , ||, !, -,  ,(comma) <br />
        Examples:<br />
        1) winter&&(forest||field)<br />
        2) autumn, -forest<br />
        3) winter&&!(forest||tree)<br />
        Available comparison operators (only works with width/height): {`==,>=,<=,<,>`}<br />
        1) sea&&width==1920&&height==1080<br />
        2) mountains,{`width>2000,height>2000`} <br />
        3) water && {`width<1000&&height<1000`}<br />
        List of all available tags - <Link href='/tags'>/tags</Link> <br />
          <br />
        Semantic search<br />
        Try to use prompts like {`"A photo of a {label}"`} and provide more context.<br />
        Examples:<br />
        1) a photo of a snow forest<br />
        2) a photo of a dawn near the sea<br />
        3) a photo of a snowy mountain<br />
        This type of search is not reliable.
      </Box>
      </Container>
    </div>
  )
}