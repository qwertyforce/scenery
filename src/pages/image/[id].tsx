import AppBar from '../../components/AppBar'
import { DataContext } from "../../components/DataContext"
import { makeStyles } from 'tss-react/mui';
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import LabelIcon from '@mui/icons-material/Label'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AspectRatioIcon from '@mui/icons-material/AspectRatio'
import DescriptionIcon from '@mui/icons-material/Description'
import LinkIcon from '@mui/icons-material/Link'
import { GetServerSideProps } from 'next'
import db_ops from '../../server/helpers/db_ops'
import CreateIcon from '@mui/icons-material/Create'
import Chip from '@mui/material/Chip'
import { useContext, useEffect, useState } from 'react'

const useStyles = makeStyles()((theme:any) => ({
  root: {
    flexGrow: 1,
  },
  icon_container: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  chip: {
    margin: 5
  },
  grid_container: {
    padding: 12
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

interface ImageProps {
  filename: string,
  width: number,
  height: number,
  size: number,
  author: string,
  tags: string[],
  source_link: string,
  date: string,
  similar_by_tags_link: string,
  similar_by_color_link: string,
  visually_similar_link: string,
  caption: string
  // upscaled: string,
}
export default function Image(props: ImageProps) {
  const { classes } = useStyles()
  const dataContext = useContext(DataContext)
  const [photoSrc, setPhotoSrc] = useState("")
  useEffect(() => {
    if (props.filename) {
      if (dataContext?.useIPFS) {
        setPhotoSrc(`http://127.0.0.1:8080/ipns/${process.env.ipns}/images/${props.filename}`)
      } else {
        setPhotoSrc(`/images/${props.filename}`)
      }
    }
  }, [dataContext])
  const Tags = props.tags.map((tag: string) => <Chip label={tag} key={tag} className={classes.chip} component="a" href={`/search?q=${tag}&semantic=0`} clickable />)
  return (
    <div className={classes.root}>
      <AppBar />
      <div className={classes.grid_container}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper className={classes.paper}>
              <a href={photoSrc} target="_blank" rel="noreferrer">
                <img className={classes.responsive} src={photoSrc} alt={props.caption} title={props.caption}/>
              </a>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className={classes.paper}>
              <div className={classes.icon_container}>
                <CreateIcon />
                <p>&nbsp;Author: {props.author}</p>
              </div>
              <div className={classes.icon_container}>
                <AspectRatioIcon />
                <p>&nbsp;Resoltuion: {props.width}x{props.height} {props.size}MB</p>
              </div>
              <div className={classes.icon_container}>
                <CalendarTodayIcon />
                <p>&nbsp;Date: {props.date}</p>
              </div>
              <div className={classes.icon_container}>
                <LinkIcon />
              &nbsp;<a href={props.source_link} target="_blank" rel="noreferrer">Source</a>
              </div>
              <div className={classes.icon_container}>
                <LinkIcon />
              &nbsp;<a href={props.similar_by_tags_link} target="_blank" rel="noreferrer">Similar by tags</a>
              </div>
              <div className={classes.icon_container}>
                <LinkIcon />
              &nbsp;<a href={props.similar_by_color_link} target="_blank" rel="noreferrer">Similar by color</a>
              </div>
              <div className={classes.icon_container}>
                <LinkIcon />
              &nbsp;<a href={props.visually_similar_link} target="_blank" rel="noreferrer">Visually similar</a>
              </div>
              {/* {((props.upscaled) ? (
                <div className={classes.icon_container}>
                  <LinkIcon />
              &nbsp;<a href={props.upscaled} target="_blank" rel="noreferrer">Upscaled version</a>
                </div>
              ) : null)} */}
              <div className={classes.icon_container}>
                <LabelIcon />
                <p>&nbsp;Tags:</p>
                {Tags}
              </div>
              <div className={classes.icon_container}>
                <DescriptionIcon />
                <p>&nbsp;Description: {props.caption}</p>
              </div>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </div>
  )
}


export const getServerSideProps: GetServerSideProps = async (context) => {
  if (typeof context.params?.id === "string") {
    const img = await db_ops.image_ops.find_image_by_id(parseInt(context.params.id))
    if (img) {
      const date = new Date(img.created_at)
      const date_str = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
      // const upscaled = (img.tags.includes('upscaled') ? (`/upscaled/${img.id}.png`) : null)
      return {
        props: {
          filename: `${img.id}.${img.file_ext}`,
          width: img.width,
          height: img.height,
          size: (img.size / (10 ** 6)).toFixed(2),
          author: img.author,
          tags: img.tags,
          source_link: img.source_url,
          date: date_str,
          similar_by_tags_link: `/similar_by_tags/${img.id}`,
          similar_by_color_link: `/similar_by_color/${img.id}`,
          visually_similar_link: `/visually_similar/${img.id}`,
          caption: img.caption
          // upscaled: upscaled
        }
      }
    }
  }
  return {
    notFound: true
  }
}
