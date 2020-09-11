import React from 'react';
import db_ops from '../server/helpers/db_ops'

export default function Index(props: { user_data: React.ReactNode; }) {
  return (
    // <Container maxWidth="sm">
    //   <Box my={4}>
    //     <Typography variant="h4" component="h1" gutterBottom>
    //       {/* {props.authed} */}
    //     </Typography>
    //     <Link href="/about" color="secondary">
    //       Go to the about page
    //     </Link>
    //     <ProTip />
    //     <Copyright />
    //   </Box>
    // </Container>
    <div>{props.user_data}</div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context:any) {
  let authed=false;
  let user_data;
  if(context.req.session.authed&&context.req.session.user_id){
    authed=true;
    const user=await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    console.log(user[0])
    user_data=JSON.stringify(user[0])
  }
  return {
    props: {authed,user_data}, // will be passed to the page component as props
  }
}