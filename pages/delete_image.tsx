import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Button from '@material-ui/core/Button';
import axios from 'axios'
import TextField from '@material-ui/core/TextField';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import ErrorPage from 'next/error'
import { useState } from 'react';

const useStyles = makeStyles(() => ({
  backdrop: {
    zIndex: 9999,
    color: '#fff',
  },
}));

interface DeleteImageProps{
 err:boolean
}
export default function deleteImage(props: DeleteImageProps) {
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [ImageID, setID] = useState(0);
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      delete_image();
    }
  };
  const delete_image = () => {
    setOpen(true)
    axios(`/delete_image`, {
      method: "post",
      data: { id: ImageID },
      withCredentials: true
    }).then((resp) => {
      setOpen(false)
      alert(JSON.stringify(resp.data))
      setID(0)
    }).catch((err) => {
      setOpen(false)
      alert('check console for error message')
      console.log(err)
      setID(0)
    })
  }


  return (
    <div>
      <AppBar />
      <Backdrop className={classes.backdrop} open={open}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <TextField
        value ={ImageID}
        fullWidth
        type="number"
        label=" image id"
        placeholder="image id"
        margin="normal"
        onChange={(e) => setID(parseInt(e.target.value)||0)}
        onKeyPress={(e) => handleKeyPress(e)}
      />
      <Button onClick={() => { delete_image() }} variant="contained" color="primary" >Delete image</Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  // console.log(context.req)
  if (context.req?.session?.authed && context.req?.session?.user_id) {
    const user = await db_ops.activated_user.find_user_by_id(context.req.session.user_id)
    if (user.isAdmin) {
      return {
        props: {},
      }
    }
  }
  return {
    props: { err: true },
  }
}
