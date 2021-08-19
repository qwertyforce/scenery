import db_ops from '../server/helpers/db_ops'
import { GetStaticProps } from 'next'
import { makeStyles } from '@material-ui/core/styles'
import Chip from '@material-ui/core/Chip'
import { Typography } from '@material-ui/core'
import AppBar from '../components/AppBar'

const useStyles = makeStyles(() => ({
  chip: {
    margin: 5
  }
}))

interface Tags {
  _id: string,
  count: number
}

export default function Tags(props: { tags: Tags[] }) {
  const classes = useStyles()
  // const Seasons = ["winter", "spring", "summer", "autumn"]
  const Orientation = ["horizontal", "vertical", "square"]
  const Tags = []
  // const Seasons_tags = []
  const Orientation_tags = []
  let Author_tags = []
  for (const { _id, count } of props.tags) {
    const tag = <Chip label={`${_id} (${count})`} key={_id} className={classes.chip} component="a" href={`/search?q=${_id}&semantic=0`} clickable />
    // if (Seasons.includes(_id)) {
    //   Seasons_tags.push(tag)
    // } else 
    if (Orientation.includes(_id)) {
      Orientation_tags.push(tag)
    } else if (_id.includes("artist:")) {
      Author_tags.push({ tag, count })
    }
    else {
      Tags.push(tag)
    }
  }
  Author_tags = Author_tags.sort((a, b) => b.count - a.count).map((el) => el.tag)
  return (
    <div>
      <AppBar />
      {/* <Typography variant="h6" gutterBottom>
        Seasons
      </Typography>
      {Seasons_tags} */}
      <Typography variant="h6" gutterBottom>
        Orientation
      </Typography>
      {Orientation_tags}
      <Typography variant="h6" gutterBottom>
        Other
      </Typography>
      {Tags}
      <Typography variant="h6" gutterBottom>
        Authors
      </Typography>
      {Author_tags}
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const tags = await db_ops.image_ops.get_tags_stats()
  return {
    props: {
      tags: tags,
    },
    revalidate: 5 * 60 //5 min
  }
}
