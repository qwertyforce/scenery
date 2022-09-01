import { makeStyles } from 'tss-react/mui';
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Pagination from '@mui/material/Pagination'
import Link from '../components/Link'
import GalleryWrapper from '../components/GalleryWrapper'
import PaginationItem from '@mui/material/PaginationItem'
import PhotoInterface from '../types/photo'
import build_ast from "../components/parse"
import image_ops from "../server/helpers/image_ops"
import { GetServerSideProps } from 'next'

const useStyles = makeStyles()(() => ({
  pagination: {
    display: "flex",
    justifyContent: 'center'
  }
}));

interface SearchProps {
  err: boolean,
  total_images: number,
  photos: PhotoInterface[],
  search_query: string,
  semantic: string,
  current_page: number,
  max_page: number
}

export default function Search(props: SearchProps) {
  const { classes } = useStyles()
  if (props.err) {
    return (
      <div>
        <AppBar />
        <p>Total images: 0</p>
      </div>
    )
  }

  return (
    <div>
      <AppBar />
      <p>Total images: {props.total_images}</p>
      <GalleryWrapper photos={props.photos} />
      <div className={classes.pagination}>
        <Pagination count={props.max_page} defaultPage={props.current_page} renderItem={(item) => {
          return (<PaginationItem
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component={Link as any}
            href={`/search?q=${encodeURIComponent(props.search_query)}&semantic=${props.semantic}&page=${item.page}`}
            underline="none"
            {...item}
          />)
        }
        } siblingCount={3} color="primary" size="large" />
      </div>
    </div>

  )
}
const ERROR = { props: { err: true } }
export const getServerSideProps: GetServerSideProps = async (context) => {
  const nosql_injection_regex = new RegExp(/\[|\]|\$|:|\{|\}/gm) //[,],$,:,{,}

  if (typeof context.query.q !== "string" ||
    nosql_injection_regex.test(context.query.q) ||
    (typeof context.query.semantic === "string" && !(["1", "0"].includes(context.query.semantic)))
  ) {
    return ERROR
  }

  const photos: PhotoInterface[] = []
  console.log([context.query.q, context.query.semantic])
  if (context.query.semantic === "1") {
    if (context.query.q.length > 100) {
      return ERROR
    }
    const found_images: PhotoInterface[] = []
    const image_ids = await image_ops.image_text_features_get_similar_images_by_text(context.query.q)
    if (!image_ids) {
      return {
        props: {
          total_images: 0,
          photos: [],
          search_query: context.query.q,
          current_page: 1,
          max_page: 1
        }
      }
    }
    for (const image_id of image_ids) {
      const image = await db_ops.image_ops.find_image_by_id(image_id)
      if (!image) {
        continue
      }
      found_images.push({
        src: `/thumbnails/${image.id}.jpg`,
        key: `/image/${image.id}`,
        width: image.width,
        height: image.height,
        title: image.caption
      })
    }
    return {
      props: {
        total_images: found_images.length,
        photos: found_images,
        search_query: context.query.q,
        current_page: 1,
        max_page: 1
      }
    }
  }

  const query = build_ast(context.query.q)
  if (query.error) {
    return ERROR
  }

  let page: number
  if (typeof context.query.page === "string") {
    page = parseInt(context.query.page)
  } else {
    page = 1
  }
  page = Math.max(page, 1)  //page is non-negative integer
  const images_on_page = 30
  const total_num_of_images = await db_ops.image_ops.get_number_of_images_returned_by_search_query(query)
  const images = await db_ops.image_ops.batch_find_images(query, images_on_page * (page - 1), images_on_page)

  if (page <= Math.ceil(total_num_of_images / images_on_page)) {
    for (const image of images) {
      photos.push({
        src: `/thumbnails/${image.id}.jpg`,
        key: `/image/${image.id}`,
        width: image.width,
        height: image.height,
        title:image.caption
      })
    }
    return {
      props: {
        total_images: total_num_of_images,
        photos: photos,
        search_query: context.query.q,
        semantic: context.query.semantic,
        current_page: page,
        max_page: Math.ceil(total_num_of_images / images_on_page)
      }
    }
  }
  return ERROR
}