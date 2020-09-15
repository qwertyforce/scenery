import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import AppBar from '../components/AppBar'
import { DropzoneArea } from 'material-ui-dropzone';
import Button from '@material-ui/core/Button';
import config from '../config/config'
import axios from "axios"
import { useRouter } from 'next/router'

export default function ReverseSearch() {
  const router = useRouter()
  const [Files, setFiles] = useState([]);
  const send_image = (token: string) => {
    const formData = new FormData();
    formData.append("image", Files[0]);
    formData.append("g-recaptcha-response", token);
    axios(`/reverse_search`, {
      method: "post",
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((resp) => {
      router.push("/show?ids=" + resp.data.ids)
    }).catch((err) => {
      console.log(err)
    })
  }
  const _send_image = () => {
    /*global grecaptcha*/ // defined in public/index.html
    grecaptcha.ready(function () {
      grecaptcha.execute(config.recaptcha_site_key, { action: 'login' }).then(function (token) {
        send_image(token)
      });
    })
  }
  return (
    <div>
      <AppBar />
      <Box my={4}>
        <DropzoneArea
          acceptedFiles={['image/png', 'image/jpg', 'image/jpeg']}
          dropzoneText={"Drag and drop an image here or click"}
          filesLimit={1}
          maxFileSize={49000000}
          onChange={(files) => setFiles((files as never))}
        />
      </Box>
      <Button onClick={() => { _send_image() }} variant="contained" color="primary" >Reverse Search</Button>
    </div>
  );
}