import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'

export default function About() {
  return (
    <div>
      <AppBar/>
      <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          OnlyComfy.art
        </Typography>
        Only high quality comfy pony scenery art.
        <br/>
        onlycomfyart@gmail.com
      </Box>
    </Container>
    </div>
  );
}