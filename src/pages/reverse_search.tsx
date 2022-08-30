/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useState } from 'react'
import Box from '@mui/material/Box'
import AppBar from '../components/AppBar'
import { DropzoneAreaBase } from 'mui-file-dropzone'
import Button from '@mui/material/Button'
import axios from "axios"
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import { makeStyles } from 'tss-react/mui'
import TextField from '@mui/material/TextField'

const useStyles = makeStyles()(() => ({
  backdrop: {
    zIndex: 9999,
    color: '#fff',
  },
  url_div: {
    display: "flex",
    marginLeft: "10px",
    marginBottom: "10px"
  },
  url_text_field: {
    width: "300px",
    marginRight: "10px"
  },
  imgg: {
    objectFit: "contain",
    width: "150px",
    height: "150px"
  },
  result_wrapper: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-around",
    borderStyle: "dotted",
    marginTop: "10px",
    marginBottom: "10px"
  },
  result_wrapper_text: {
    position: "relative",
    marginTop: "0.3em",
    marginLeft: "0.5em",
    display: "inline",
    width: "100%"
  },
  result_element_figure: {
    marginLeft: "10px",
    marginRight: "10px",
    width: "min-content",
    display: "flex",
    flexWrap: "nowrap",
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  result_element_caption: {
    fontFamily: "monospace",
    fontSize: "medium",
    textAlign: "center",
    overflowWrap: "anywhere"
  }
}))
function isValidURL(url: string) {
  const RegExp = /^(?:(?:(?:https?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
  if (RegExp.test(url)) {
    return true
  } else {
    return false
  }
}


function ResultElement({ result }: any) {
  const { classes } = useStyles()
  return (
    <figure className={classes.result_element_figure}>
      <a target="_blank" rel="noreferrer" href={`/image/${result["image_id"]}`}>
        <img src={`/images/${result["image_id"]}.${result["ext"]}`} className={classes.imgg} />
      </a>
      <figcaption className={classes.result_element_caption}>
        <div style={{display:"flex",flexDirection:"row",flexWrap:"wrap",justifyContent:"space-evenly"}}>
          {JSON.stringify(result)}
        </div>
      </figcaption>
    </figure>
  )
}

function DisplayResults({searchResults}: any) {
  const { classes } = useStyles()
  let _key = 0
  console.log(searchResults)
  const elements = []
  // searchResults = {"test":searchResults}
  const keys_of_searchResults = []
  if(Object.keys(searchResults).includes("unified_res")){
    keys_of_searchResults.push("unified_res")
  }
  for(const key of Object.keys(searchResults)){
    if(key!=="unified_res"){
      keys_of_searchResults.push(key)
    }
  }
  for (const key of keys_of_searchResults) {
    const children = []
    for (const child of searchResults[key]) {
        children.push(<ResultElement key={_key++} result={child} />)
      }
    console.log(children)
    elements.push(
      <div key={_key++} className={classes.result_wrapper}>
        <div className={classes.result_wrapper_text}>{key}</div>
        {children}
      </div>)
  }
  console.log(elements)
  console.log(elements.length)
  return (<Fragment>
    {elements}
  </Fragment>)
}

export default function ReverseSearch() {
  const { classes } = useStyles()
  const [URL, setUrl] = useState("")
  const [fileObjects, setFileObjects] = useState([])
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any>({})

  
  const send_image = (token:string) => {
    const formData = new FormData()
    formData.append("image", (fileObjects[0] as any).file)
    formData.append("g-recaptcha-response", token)
    const search_url = "/reverse_search"
    
    setOpen(true)
    axios(search_url, {
      method: "post",
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5 * 60000   //5min
    }).then((resp) => {
      setOpen(false)
      setSearchResults(resp.data)
      console.log(resp.data)
    }).catch((err) => {
      setOpen(false)
      console.log(err)
    })
  }
  const proxy_get_image = (token: string, url: string) => {
    const get_image_data = { image_url: url,'g-recaptcha-response': token }
    axios(`/proxy_get_image`, {
      method: "post",
      data: get_image_data,
      responseType: "blob"
    }).then((resp) => {
      const file = new File([resp.data], "image.png", { type: "image/png" })
      const reader = new FileReader()
      reader.readAsDataURL(resp.data)
      reader.onloadend = function () {
        const base64data = reader.result
        setFileObjects(([{ data: base64data, file: file }]) as any)
        setUrl("")
        setOpen(false)
        return
      }
    }).catch(async (err) => {
      setOpen(false)
      const response = JSON.parse(await new Response(err.response.data).text()).message
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
       })
     })
    // send_image()
  }
  const get_image_by_url = async () => {
    if (!isValidURL(URL)) {
      alert("invalid url")
      setUrl("")
      return
    }
    setOpen(true)
    try {
      const x = await axios.get(URL, { responseType: "blob" })
      setOpen(false)
      const file = new File([x.data], "image.png", { type: "image/png" })
      const reader = new FileReader()
      reader.readAsDataURL(x.data)
      reader.onloadend = function () {
        const base64data = reader.result
        setFileObjects(([{ data: base64data, file: file }]) as any)
        setUrl("")
        return
      }
    } catch (err: any) {
      console.log(err)
      if (!err.response) {
        grecaptcha.ready(function () {
          grecaptcha.execute(process.env.recaptcha_site_key, { action: 'proxy_get_image' }).then(function (token) {
            proxy_get_image(token, URL)
          })
        })
        // proxy_get_image(URL)
      }

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
          <TextField onChange={(e) => setUrl(e.target.value)} value={URL}
            className={classes.url_text_field} label="url"
            placeholder="https://somesite.com/image.png" variant="outlined" size="small" />
          <Button onClick={get_image_by_url} size="small" variant="outlined">Fetch</Button>
        </div>
        <DropzoneAreaBase
          acceptedFiles={['image/png', 'image/jpg', 'image/jpeg']}
          dropzoneText={"Drag and drop an image here or click"}
          fileObjects={fileObjects}
          filesLimit={1}
          onAdd={(newFileObjs: any) => {
            console.log(newFileObjs)
            console.log('onAdd', newFileObjs)
            setFileObjects([].concat(newFileObjs[0]))
          }}
          onDelete={(_removedFileObj, removedFileObjIdx) => {
            const remainingFileObjs = fileObjects.filter((_fileObject, i) => {
              return i !== removedFileObjIdx
            })
            setFileObjects(remainingFileObjs)
          }}
          maxFileSize={49000000}
        />
      </Box>
        <Button onClick={() => { _send_image() }} variant="contained" color="primary">Reverse Search</Button>
      <DisplayResults searchResults={searchResults}/>
    </div>
  )
}
