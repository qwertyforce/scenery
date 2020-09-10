import AppBar from '../../components/AppBar'
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import LabelIcon from '@material-ui/icons/Label';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import AspectRatioIcon from '@material-ui/icons/AspectRatio';
import config from '../../config/config'
// import FavoriteIcon from '@material-ui/icons/Favorite';
import { GetStaticProps,GetStaticPaths } from 'next'
import path from 'path'
import fs from 'fs'
import db_ops from '../../server/helpers/db_ops'

import CreateIcon from '@material-ui/icons/Create';
import Chip from '@material-ui/core/Chip';
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  chip:{
    margin:5
  },
  grid_container:{
    padding:12
  },
  responsive: {
    maxWidth: '100%',
    height: 'auto',
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));
//https://dummyimage.com/600x400/000/fff
export default function Image(props: {filename: string; }) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <AppBar />
      <div className={classes.grid_container}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className={classes.paper}> <img className={classes.responsive} src={`${config.domain}/images/${props.filename}`} /></Paper> 
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className={classes.paper}>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <CreateIcon />
              <p>&nbsp;Author: Qwerryt</p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <AspectRatioIcon />
              <p>&nbsp;Resoltuion: 5000x5000 5MB</p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <CalendarTodayIcon />
              <p>&nbsp;Date: 12.12.12</p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap:'wrap'
            }}>
              <LabelIcon />
              <p>&nbsp;Tags:</p>
              <Chip label="Clickable Link" className={classes.chip} component="a" href="#chip" clickable />
            <Chip label="Clickable Link" className={classes.chip} component="a" href="#chip" clickable />
            <Chip label="Clickable Link" className={classes.chip} component="a" href="#chip" clickable />
            <Chip label="Clickable Link" className={classes.chip} component="a" href="#chip" clickable />
            </div>
           
          </Paper>
        </Grid>
      </Grid>
      </div>
    </div>
  );
}


export const getStaticProps: GetStaticProps = async (context) => {
  if(context.params){
    const postsDirectory = path.join(process.cwd(), 'public','images')
    const filenames = fs.readdirSync(postsDirectory)
    for(const filename of filenames){
      if(filename.includes((context.params.id as string))){
        return {
          props: {
            filename:filename
          },
        }
      }
    }
  }
  return {
    props: {
      filename:"123"
    },
  }
 
}

export const getStaticPaths: GetStaticPaths = async () => {
  const images=await db_ops.image_ops.get_all_images()
  const paths = images.map((image) => ({ params: { id: image.id.toString()}} ))
  return {
    paths: paths,
    fallback: true
  };

}

 

// const Image = () => {
//   const router = useRouter()
//   const { id } = router.query

//   return (
//   <div>
// <p>Post: {id}</p>
//   </div>

//   )
// }

// export default Image