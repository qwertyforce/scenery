import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Button from '@material-ui/core/Button';
import axios from 'axios'
import config from '../config/config'
import TextField from '@material-ui/core/TextField';

import ErrorPage from 'next/error'
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Import_from_derpi(props:any) {
  if(props.err){
    return <ErrorPage statusCode={404} />
  }
  const [error, setError] = useState(false);
  const [ImageID, setID] = useState('');
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
       add_image();
    }
  };
  const add_image=()=>{
    axios(`${config.domain}/import_from_derpi`, {
      method: "post",
      data: {id:ImageID},
      withCredentials: true
    }).then((resp)=>{
      alert(JSON.stringify(resp.data))
    }).catch((err)=>{
      console.log(err)
    })
  }
 
 
  return (
    <div>
      <AppBar />
      <TextField
                error={error}
                fullWidth
                type="number"
                label="Derpi image id"
                placeholder="Derpi image id"
                margin="normal"
                onChange={(e)=>setID(e.target.value)}
                onKeyPress={(e)=>handleKeyPress(e)}
              />
      <Button onClick={() => {add_image() }} variant="contained" color="primary" >Add image</Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context:any) {
  if(context.req.session.authed&&context.req.session.user_id){
    const user=await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    if(user[0].isAdmin){
      return {
        props:  {},  
      }
  }
}
  return {
    props: {err:true},  
  }
}
 