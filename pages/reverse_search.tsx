/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'
import { DropzoneAreaBase } from 'material-ui-dropzone';
import Button from '@material-ui/core/Button';
import config from '../config/config'
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

export default function ReverseSearch() {
  const classes = useStyles();
  const router = useRouter()
  const [url, setUrl] = useState("");
  const [fileObjects, setFileObjects] = useState([]);
  const [open, setOpen] = useState(false);
  const send_image = (token: string,mode:string) => {
    setOpen(true)
    const formData = new FormData();
    formData.append("image", fileObjects[0].file);
    formData.append("g-recaptcha-response", token);
    formData.append("mode", mode);
    axios(`${config.reverse_search_url}/reverse_search`, {
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
  const _send_image = (mode:string) => {
    /*global grecaptcha*/ // defined in pages/_document.tsx
    grecaptcha.ready(function () {
      grecaptcha.execute(config.recaptcha_site_key, { action: 'reverse_search' }).then(function (token) {
        send_image(token,mode)
      });
    })
  }
  const get_image_by_url= async ()=>{
    setOpen(true)
    try{
      const x =await axios.get(url,{responseType:"blob"})
      setOpen(false)
      const file = new File([x.data], "image.png", {type:"image/png"});
      const reader = new FileReader();
      reader.readAsDataURL(x.data);
      reader.onloadend = function () {
        const base64data = reader.result;

        setFileObjects( ([{data:base64data,file:file}]) as any)
        return;
      }
    }catch(err){
      setOpen(false)
      alert("error")
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
        <TextField onChange={(e)=>setUrl(e.target.value)} value={url} className={classes.url_text_field} label="url" variant="outlined" size="small" />
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
      <Button onClick={() => { _send_image("1") }} variant="contained" color="primary" >Reverse Search (fast, less accurate)</Button>
      <div style={{marginTop:"10px"}}><Button onClick={() => { _send_image("2") }} variant="contained" color="primary" >Reverse Search (slow, more accurate)</Button></div>
    </div>
  );
}