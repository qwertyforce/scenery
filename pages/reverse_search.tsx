/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'
import { DropzoneAreaBase } from 'material-ui-dropzone';
import Button from '@material-ui/core/Button';
import axios from "axios"
import { useRouter } from 'next/router'
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles(() => ({
  backdrop: {
    zIndex: 9999,
    color: '#fff',
  },
  url_div:{
    display:"flex",
    marginLeft:"10px",
    marginBottom:"10px"
  },
  url_text_field:{
    width:"300px",
    marginRight:"10px"
  }
}));
function isValidURL(url:string){
  const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
  if(RegExp.test(url)){
      return true;
  }else{
      return false;
  }
} 

export default function ReverseSearch() {
  const classes = useStyles();
  const router = useRouter()
  const [URL, setUrl] = useState("");
  const [fileObjects, setFileObjects] = useState([]);
  const [open, setOpen] = useState(false);
  const send_image = (token: string) => {
    setOpen(true)
    const formData = new FormData();
    formData.append("image", (fileObjects[0] as any).file);
    formData.append("g-recaptcha-response", token);
    axios(`${process.env.reverse_search_url}/reverse_search`, {
      method: "post",
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout:5*60000   //5min
    }).then((resp) => {
      setOpen(false)
      console.log(resp.data.ids)
      router.push("/show?ids=" + resp.data.ids)
    }).catch((err) => {
      setOpen(false)
      console.log(err)
    })
  }
  const proxy_get_image=(token:string,url:string)=>{
    const login_data = { image_url: url, 'g-recaptcha-response': token }
    axios(`/proxy_get_image`, {
      method: "post",
      data: login_data,
      responseType:"blob"
    }).then((resp) => {
      const file = new File([resp.data], "image.png", {type:"image/png"});
      const reader = new FileReader();
      reader.readAsDataURL(resp.data);
      reader.onloadend = function () {
        const base64data = reader.result;
        setFileObjects( ([{data:base64data,file:file}]) as any)
        setUrl("")
        setOpen(false)
        return;
      }
    }).catch(async(err) => {
      setOpen(false)
      const response =JSON.parse(await new Response(err.response.data).text()).message
      if (response) {
        alert(response)
        console.log(err.response)
      } else {
        alert("Unknown error")
      }
    })
  }
  const _send_image = () => {
    /*global grecaptcha*/ // defined in pages/_document.tsx
    grecaptcha.ready(function () {
      grecaptcha.execute(process.env.recaptcha_site_key, { action: 'reverse_search' }).then(function (token) {
        send_image(token)
      });
    })
  }
  const get_image_by_url= async ()=>{ 
    if(!isValidURL(URL)){
      alert("invalid url")
      setUrl("")
      return
    }
    setOpen(true)
    try{
      const x =await axios.get(URL,{responseType:"blob"})
      setOpen(false)
      const file = new File([x.data], "image.png", {type:"image/png"});
      const reader = new FileReader();
      reader.readAsDataURL(x.data);
      reader.onloadend = function () {
        const base64data = reader.result;
        setFileObjects( ([{data:base64data,file:file}]) as any)
        setUrl("")
        return;
      }
    }catch(err){
      console.log(err)
      if(!err.response){
        grecaptcha.ready(function () {
          grecaptcha.execute(process.env.recaptcha_site_key, { action: 'reverse_search' }).then(function (token) {
            proxy_get_image(token,URL)
          });
        })
      }
      
      // alert("error")
    }
  }

  return (
    <div>
      <AppBar />
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box my={4}>
      <div className={classes.url_div}>
        <TextField onChange={(e)=>setUrl(e.target.value)} value={URL} 
        className={classes.url_text_field} label="url"
        placeholder="https://somesite.com/image.png" variant="outlined" size="small" />
      <Button onClick={get_image_by_url} size="small" variant="outlined">Fetch</Button>
      </div>
        <DropzoneAreaBase
          acceptedFiles={['image/png', 'image/jpg', 'image/jpeg']}
          dropzoneText={"Drag and drop an image here or click"}
          fileObjects={fileObjects}
          filesLimit={1}
          onAdd={(newFileObjs:any) => {
            console.log(newFileObjs)
            console.log('onAdd', newFileObjs);
            setFileObjects([].concat(newFileObjs[0]));
          }}
          onDelete={(_removedFileObj, removedFileObjIdx) => {
            const remainingFileObjs = fileObjects.filter((_fileObject, i) => {
              return i !== removedFileObjIdx;
          });
          setFileObjects(remainingFileObjs)
          }}
          maxFileSize={49000000}
        />
      </Box>
      <Button onClick={() => { _send_image() }} variant="contained" color="primary">Reverse Search</Button>
    </div>
  );
}