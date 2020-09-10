import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import Head from 'next/head'
import Button from '@material-ui/core/Button';
import axios from 'axios'
import config from '../../config/config'
import { useEffect } from 'react';
import ErrorPage from 'next/error'

export default function Image(props) {
  if(props.err){
    return <ErrorPage statusCode={404} />
  }
  const send_image_data=(image_data: Record<string,unknown>)=>{
    axios(`${config.domain}/update_image_data`, {
      method: "post",
      data: {image_data},
      withCredentials: true
    }).then((resp)=>{
      alert(JSON.stringify(resp.data))
    }).catch((err)=>{
      console.log(err)
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let JSONEditor:any;
  useEffect(()=>{
    const container=document.getElementById("jsoneditor")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSONEditor = new (window as any).JSONEditor(container,{})
    JSONEditor.set(JSON.parse(props.img_data))
  },[])
  return (
    <div>
       <Head>
       <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.0.5/jsoneditor.min.css"/>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.0.5/jsoneditor.min.js"></script>
      </Head>
      <AppBar />
      <div id="jsoneditor" style={{width:"100%",height:"400px"}}></div>
      <Button onClick={() => {send_image_data(JSONEditor.get()) }} variant="contained" color="primary" >Update image</Button>
    </div>
  );
}

export async function getServerSideProps(context) {
  if(context.req.session.authed&&context.req.session.user_id){
    const user=await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    if(!user[0].isAdmin){
      return
    }
    const img=await db_ops.image_ops.find_image_by_id(parseInt(context.params.id))
    return {
      props: {img_data:JSON.stringify(img[0]),err:false}, // will be passed to the page component as props
    }
  }
  return {
    props: {err:true},  
  }
}
 