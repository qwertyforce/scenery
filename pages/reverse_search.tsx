import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'
import { DropzoneArea } from 'material-ui-dropzone';
import Button from '@material-ui/core/Button';
import config from '../config/config'
import axios from "axios"
import { useRouter } from 'next/router'
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  backdrop: {
    zIndex: 9999,
    color: '#fff',
  },
}));

export default function ReverseSearch() {
  const classes = useStyles();
  const router = useRouter()
  const [Files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const send_image = (token: string,mode:string) => {
    setOpen(true)
    const formData = new FormData();
    formData.append("image", Files[0]);
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
  return (
    <div>
      <AppBar />
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box my={4}>
        <DropzoneArea
          acceptedFiles={['image/png', 'image/jpg', 'image/jpeg']}
          dropzoneText={"Drag and drop an image here or click"}
          filesLimit={1}
          maxFileSize={49000000}
          onChange={(files) => setFiles((files as never))}
        />
      </Box>
      <Button onClick={() => { _send_image("1") }} variant="contained" color="primary" >Reverse Search (fast, less accurate)</Button>
      <div style={{marginTop:"10px"}}><Button onClick={() => { _send_image("2") }} variant="contained" color="primary" >Reverse Search (slow, more accurate)</Button></div>
      
    </div>
  );
}