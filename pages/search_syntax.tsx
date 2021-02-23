import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'

export default function SearchSyntax() {
  return (
    <div>
      <AppBar />
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search syntax
        </Typography>
        Available logical operators: && , ||, !, -,  ,(comma) <br/>
        Examples:<br/>
        1) winter&&(rarity||fluttershy)<br/>
        2) autumn, -twilight sparkle<br/>
        3) winter&&!(forest||tree)<br/>
        Available comparison operators (only works with width/height): {`==,>=,<=,<,>`}<br/>
        1) applejack&&width==1920&&height==1080<br/>
        2) pinkie pie,{`width>2000,height>2000`} <br/>
        3) rainbow dash && {`width<1000&&height<1000`}<br/>
      </Box>
      </Container>
    </div>
  );
}