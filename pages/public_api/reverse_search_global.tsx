/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import AppBar from '../../components/AppBar'
import { DropzoneAreaBase } from 'material-ui-dropzone';
import Button from '@material-ui/core/Button';
import config from '../../config/config'
import axios from "axios"
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

export default function GlobalReverseSearch() {
  const classes = useStyles();
  const [SearchResults, setSearchResults] = useState([]);
  const [URL, setUrl] = useState("");
  const [fileObjects, setFileObjects] = useState([]);
  const [open, setOpen] = useState(false);

  const process_results=(data:any)=>{
    const response_obj = data
    const search_results: any = []
    for (const booru in response_obj) {
      if (response_obj[booru] !== "error") {
        for (const img of response_obj[booru].images) {
          search_results.push(`${booru}/${img.id}`)
        }
      }
    }
    if (search_results.length === 0) {
      const not_found: any = ["not found"]
      setSearchResults(not_found)
    } else {
      setSearchResults(search_results)
    }
  }
  const send_image = (token: string) => {
    setOpen(true)
    const formData = new FormData();
    formData.append("image", (fileObjects[0] as any).file);
    formData.append("g-recaptcha-response", token);
    axios(`${config.api_domain}/reverse_search_global`, {
      method: "post",
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout:5*60000   //5min
    }).then((resp) => {
      setOpen(false)
      process_results(resp.data)
    }).catch((err) => {
      setOpen(false)
      console.log(err)
      alert(err)
    })
  }

  const _send_image = () => {
    /*global grecaptcha*/ // defined in pages/_document.tsx
    grecaptcha.ready(function () {
      grecaptcha.execute(config.recaptcha_site_key, { action: 'reverse_search' }).then(function (token) {
        send_image(token)
      });
    })
  }

  const find_image_by_url = async () => {
    setSearchResults([])
    if (!isValidURL(URL)) {
      alert("invalid url")
      setUrl("")
      return
    }
    setOpen(true)
    try {
      const x = await axios.post(`${config.api_domain}/reverse_search_global?url=${URL}`)
      process_results(x.data)
      setOpen(false)
      setUrl("")
    } catch (err) {
      setOpen(false)
      console.log(err)
      alert(err)
    }
  }

  return (
    <div>
      <AppBar use_abs_links={true}/>
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box my={4}>
      <div className={classes.url_div}>
        <TextField onChange={(e)=>setUrl(e.target.value)} value={URL} 
        className={classes.url_text_field} label="url"
        placeholder="https://somesite.com/image.png" variant="outlined" size="small" />
      <Button onClick={find_image_by_url} size="small" variant="outlined">Find by link</Button>
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
      <Button onClick={() => { _send_image() }} variant="contained" color="primary" >Find by file</Button>
      <div>
      Results<br/>
      {(SearchResults[0]==="not found")?"not found":SearchResults.map((el)=><div key={el}><a href={el}>{el}</a></div>)}
      </div>
    </div>
  );
}