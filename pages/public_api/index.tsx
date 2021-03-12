import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '../../components/AppBar'
import config from '../../config/config'
import {makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Link from '../../components/Link'

const useStyles = makeStyles(() => ({
  api_route: {
    padding:5,
    marginTop:10,
    width:"fit-content!important"
  }
}));

export default function Api() {
  const classes = useStyles();
  return (
    <div>
      <AppBar />
      <Container maxWidth="md">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            API
        </Typography>
            <Paper className={classes.api_route}>
            <h3>Reverse search across ponerpics,derpibooru,bronyhub,ponybooru</h3>
            <Link href={`${config.api_domain}/reverse_search_global`}>UI</Link>

            <h4>{`Reverse search by link, returns all info - GET${config.api_domain}/reverse_search_global?url=https://sitename.com/image.jpg`}</h4>
            <h4>{`Reverse search by link, returns only links - GET ${config.api_domain}/reverse_search_global?briefly=1&url=https://sitename.com/image.jpg`}</h4>
            <h4>{`Reverse search by image file - POST ${config.api_domain}/reverse_search_global`}</h4>
            <h4>multipart/form-data; put image data (binary) in `image` field, put {"1"} in  briefly field if you  only want to get links</h4>
            </Paper>
            <Paper className={classes.api_route}>
            <h3>Get all images</h3>
            <h4>{`Get all images - GET ${config.api_domain}/get_all_images`}</h4>
            <h4>Returns json with information about all images</h4>
            </Paper>
        </Box>
      </Container>
    </div>
  );
}