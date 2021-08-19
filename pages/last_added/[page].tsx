import { makeStyles } from '@material-ui/core/styles'
import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import Pagination from '@material-ui/lab/Pagination'
import { GetStaticProps, GetStaticPaths } from 'next'
import { useRouter } from 'next/router'
import Link from '../../components/Link'
import Footer from '../../components/Footer'
import GalleryWrapper from '../../components/GalleryWrapper'
import ErrorPage from 'next/error'
import PaginationItem from "@material-ui/lab/PaginationItem/PaginationItem"
import PhotoInterface from '../../types/photo'


const useStyles = makeStyles(() => ({
  flex_center: {
    display: "flex",
    justifyContent: 'center'
  },
  visible: {
    visibility: "visible"
  },
  hidden: {
    visibility: "hidden"
  }
}))

interface LastAddedPageProps {
  photos: PhotoInterface[],
  current_page: number,
  max_page: number,
  err: boolean
}


export default function LastAddedPage(props: LastAddedPageProps) {
  const classes = useStyles()
  const router = useRouter()
  if (router.isFallback) {
    return <ErrorPage statusCode={404} />
  }
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div>
      <AppBar />
      <GalleryWrapper photos={props.photos} />
      <div className={classes.flex_center}>
        <Pagination count={props.max_page} defaultPage={props.current_page} renderItem={(item) => {
          return (<PaginationItem
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component={Link as any}
            href={`/last_added/${item.page}`}
            prefetch={false}
            underline="none"
            {...item}
          />)
        }
        } siblingCount={3} color="primary" size="large" />
      </div>
      <Footer />
    </div>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const images_on_page = 30
  const photos = []
  if (typeof context.params?.page === "string") {
    const page = parseInt(context.params.page)
    const total_num_of_images = await db_ops.image_ops.get_number_of_images_returned_by_search_query({})
    if (page >= 1 && page <= Math.ceil(total_num_of_images / images_on_page)) {
      const images = await db_ops.image_ops.batch_find_images({}, images_on_page * (page - 1), images_on_page)
      for (const image of images) {
        photos.push({
          src: `/thumbnails/${image.id}.jpg`,
          key: `/image/${image.id}`,
          width: image.width,
          height: image.height
        })
      }
      return {
        props: {
          photos: photos,
          current_page: page,
          max_page: Math.ceil(total_num_of_images / images_on_page)
        },
        revalidate: 1 * 60 //1 min
      }
    }
  }
  return {
    props: { err: true },
    revalidate: 1 * 60 //1 min
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const images = await db_ops.image_ops.get_all_images()
  const images_on_page = 30
  const paths = []
  for (let i = 1; i <= Math.ceil(images.length / images_on_page); i++) {
    paths.push({ params: { page: i.toString() } })
  }
  return {
    paths: paths,
    fallback: true
  }
}

