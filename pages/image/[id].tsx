import AppBar from '../../components/AppBar'
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import LabelIcon from '@material-ui/icons/Label';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import AspectRatioIcon from '@material-ui/icons/AspectRatio';
import LinkIcon from '@material-ui/icons/Link';
import { GetStaticProps, GetStaticPaths } from 'next'
import db_ops from '../../server/helpers/db_ops'
import ErrorPage from 'next/error'
import CreateIcon from '@material-ui/icons/Create';
import Chip from '@material-ui/core/Chip';
import { useRouter } from 'next/router'

const useStyles = makeStyles((theme) => ({
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

interface ImageProps{
  filename: string,
  width:number,
  height: number,
  size: number,
  author: string,
  tags: string[],
  booru:string,
  booru_link: string,
  source_link: string,
  date: string,
  similar_by_tags_link: string,
  similar_by_color_link:string,
  visually_similar_link:string,
  upscaled:string,
  err:boolean
}
 export default function Image(props: ImageProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <ErrorPage statusCode={404} />
  }
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  const classes = useStyles();


  const Tags = props.tags.map((tag: string) => <Chip label={tag} key={tag} className={classes.chip} component="a" href={`/search?q=${tag}`} clickable />);
  return (
    <div className={classes.root}>
      <AppBar />
      <div className={classes.grid_container}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper className={classes.paper}> <img className={classes.responsive} src={`/images/${props.filename}`} /></Paper>
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
              {(props.booru ? (
                  <div className={classes.icon_container}>
                    <LinkIcon />
              &nbsp;<a href={props.booru_link} target="_blank" rel="noreferrer">{props.booru} link</a>
                  </div>) : null)}
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
              &nbsp;<a href={props.visually_similar_link} target="_blank" rel="noreferrer">Visually similar (Beta)</a>
              </div>
              {((props.upscaled)?(
                <div className={classes.icon_container}>
                <LinkIcon />
              &nbsp;<a href={props.upscaled} target="_blank" rel="noreferrer">Upscaled version</a>
              </div>
                ):null)}
              <div className={classes.icon_container}>
                <LabelIcon />
                <p>&nbsp;Tags:</p>
                {Tags}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}


export const getStaticProps: GetStaticProps = async (context) => {
  if (typeof context.params?.id === "string") {
    const img = await db_ops.image_ops.find_image_by_id(parseInt(context.params.id))
    if (img) {
      const date = new Date(img.created_at)
      const date_str = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
      const upscaled = (img.tags.includes('upscaled')?(`/upscaled/${img.id}.png`):null)
      return {
        props: {
          filename: `${img.id}.${img.file_ext}`,
          width: img.width,
          height: img.height,
          size: (img.size / (10 ** 6)).toFixed(2),
          author: img.author,
          tags: img.tags,
          booru:img.booru,
          booru_link: img.booru_link,
          source_link: img.source_url,
          date: date_str,
          similar_by_tags_link:`/similar_by_tags/${img.id}`,
          similar_by_color_link:`/similar_by_color/${img.id}`,
          visually_similar_link:`/visually_similar/${img.id}`,
          upscaled:upscaled
        },
        revalidate: 5*60 //5 min
      }
    }
  }
  return {
    props: {err: true},
    revalidate: 5*60 //5 min
  }

}

export const getStaticPaths: GetStaticPaths = async () => {
  const images = await db_ops.image_ops.get_all_images()
  const paths = images.map((image) => ({ params: { id: image.id.toString() } }))
  return {
    paths: paths,
    fallback: true
  };
}
