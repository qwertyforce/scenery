import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ProTip from '../components/ProTip';
import Link from '../components/Link';
import Copyright from '../components/Copyright';
import db_ops from '../server/helpers/db_ops'
export default function Index(props) {
  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {/* {props.authed} */}
        </Typography>
        <Link href="/about" color="secondary">
          Go to the about page
        </Link>
        <ProTip />
        <Copyright />
      </Box>
    </Container>
  );
}

export async function getServerSideProps(context) {
  let authed=false;
  if(context.req.session.authed&&context.req.session.user_id){
    authed=true;
    const user=await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    console.log(user[0])
  }
  return {
    props: {authed}, // will be passed to the page component as props
  }
}