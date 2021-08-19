/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent, Dispatch, SetStateAction, useState } from 'react'
import Box from '@material-ui/core/Box'
import AppBar from '../components/AppBar'
import { DropzoneAreaBase } from 'material-ui-dropzone'
import Button from '@material-ui/core/Button'
import axios from "axios"
import db_ops from '../server/helpers/db_ops'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Paper from '@material-ui/core/Paper'
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete'
import Chip from '@material-ui/core/Chip'
import { GetServerSideProps } from 'next'


const useStyles = makeStyles(() => ({
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
  fetch_img_div: {
    display: "flex",
    marginBottom: "10px"
  },
  upload_interface: {
    margin: "10px",
    padding: "10px"
  },
  tags_field: {
    margin: 10
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

function AutoCompleteTagTextField(props: { all_tags: string[], selectedTags: string[], setSelectedTags: Dispatch<SetStateAction<string[]>> }) {
  const classes = useStyles()
  const [inputValue, setInputValue] = useState("")
  const [openTagsAutocomplete, setOpenTagsAutocomplete] = useState(false)
  const filterOptions = createFilterOptions({
    matchFrom: 'start'
  })
  const handleOpenTagsAutocomplete = () => {
    if (inputValue.length > 0) {
      setOpenTagsAutocomplete(true)
    }
  }
  const handleInputChange = (_event: ChangeEvent<unknown>, newInputValue: string) => {
    setInputValue(newInputValue)
    if (newInputValue.length > 0) {
      setOpenTagsAutocomplete(true)
    } else {
      setOpenTagsAutocomplete(false)
    }
  }
  return (
    <Autocomplete
      className={classes.tags_field}
      multiple
      autoComplete
      freeSolo
      open={openTagsAutocomplete}
      onOpen={handleOpenTagsAutocomplete}
      onClose={() => setOpenTagsAutocomplete(false)}
      onInputChange={handleInputChange}
      filterOptions={filterOptions}
      id="tags-filled"
      options={props.all_tags}
      value={props.selectedTags}
      onChange={(_event: ChangeEvent<unknown>, newValue) => {
        props.setSelectedTags(newValue as string[])
      }}
      defaultValue={["2"]}
      filterSelectedOptions
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip variant="outlined" key={option as string} label={option as string} {...getTagProps({ index })} />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} variant="outlined" label="Tags" placeholder="Tags" />
      )}
    />)
}

export default function Import(props: { err: boolean, all_tags: string[] }) {
  const classes = useStyles()
  const [URL, setUrl] = useState("")
  const [source_URL, setSource_URL] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [fileObjects, setFileObjects] = useState([])
  const [open, setOpen] = useState(false)

  const upload_image = () => {
    setOpen(true)
    const formData = new FormData()
    formData.append("image", (fileObjects[0] as any).file)
    formData.append("source_URL", source_URL)
    formData.append("tags", JSON.stringify(selectedTags))
    axios(`${process.env.domain}/import_image`, {
      method: "post",
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5 * 60000   //5min
    }).then((resp) => {
      setOpen(false)
      setUrl("")
      setSource_URL("")
      setSelectedTags([])
      setFileObjects([])
      alert(JSON.stringify(resp.data))
    }).catch((err) => {
      setOpen(false)
      alert('check console for error message')
      console.log(err)
    })
  }
  const proxy_get_image = (token: string, url: string) => {
    const login_data = { image_url: url, 'g-recaptcha-response': token }
    axios(`/proxy_get_image`, {
      method: "post",
      data: login_data,
      responseType: "blob"
    }).then((resp) => {
      console.log(resp.data)
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
    } catch (err) {
      console.log(err)
      if (!err.response) {
        grecaptcha.ready(function () {
          grecaptcha.execute(process.env.recaptcha_site_key, { action: 'import_image' }).then(function (token) {
            proxy_get_image(token, URL)
          })
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
      <Box my={2}>
        <div className={classes.url_div}>
          <TextField
            value={source_URL}
            onChange={(e) => setSource_URL(e.target.value)}
            type="text"
            label="Source url"
            className={classes.url_text_field}
            placeholder="https://somesite.com/artist/"
            variant="outlined"
            size="small"
          />
        </div>
        <Paper className={classes.upload_interface} elevation={6}>
          <h4 style={{ margin: 0, marginBottom: "5px" }}>Image</h4>
          <div className={classes.fetch_img_div}>
            <TextField onChange={(e) => setUrl(e.target.value)} value={URL}
              className={classes.url_text_field} label="Image url"
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
            maxFileSize={120000000}
          />
        </Paper>
      </Box>
      <AutoCompleteTagTextField all_tags={props.all_tags} selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
      <Button style={{ marginLeft: 10 }} onClick={() => { upload_image() }} variant="contained" color="primary" >Upload</Button>
    </div>
  )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.session.authed && context.req.session.user_id) {
    const user = await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    if (user?.isAdmin) {
      const imgs = await db_ops.image_ops.get_all_images()
      const tags: Set<string> = new Set()
      for (const img of imgs) {
        for (const tag of img.tags) {
          tags.add(tag)
        }
      }
      return {
        props: { all_tags: [...tags] },
      }
    }
  }
  return {
    props: { notFound: true },
  }
}
