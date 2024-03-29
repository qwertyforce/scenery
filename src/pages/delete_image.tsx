import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Button from '@mui/material/Button'
import axios from 'axios'
import TextField from '@mui/material/TextField'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import { GetServerSideProps } from 'next'
import { makeStyles } from 'tss-react/mui';
import { KeyboardEvent, useState } from 'react'

const useStyles = makeStyles()(() => ({
  backdrop: {
    zIndex: 9999,
    color: '#fff',
  },
}));

export default function deleteImage() {
  const { classes } = useStyles()
  const [open, setOpen] = useState(false)
  const [imageID, setImageID] = useState(0)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      delete_image()
    }
  }
  const delete_image = () => {
    setOpen(true)
    axios(`/delete_image`, {
      method: "post",
      data: { id: imageID },
      withCredentials: true
    }).then((resp) => {
      setOpen(false)
      alert(JSON.stringify(resp.data))
      setImageID(0)
    }).catch((err) => {
      setOpen(false)
      alert('check console for error message')
      console.log(err)
      setImageID(0)
    })
  }

  return (
    <div>
      <AppBar />
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <TextField
        value={imageID}
        fullWidth
        type="number"
        label=" image id"
        placeholder="image id"
        margin="normal"
        onChange={(e:any) => setImageID(parseInt(e.target.value) || 0)}
        onKeyPress={(e: KeyboardEvent<HTMLDivElement>) => handleKeyPress(e)}
      />
      <Button onClick={() => { delete_image() }} variant="contained" color="primary" >Delete image</Button>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req?.session?.user_id) {
    const user = await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    if (user && user.isAdmin) {
      return {
        props: {},
      }
    }
  }
  return {
    props: { notFound: true },
  }
}
