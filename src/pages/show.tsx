import db_ops from '../server/helpers/db_ops'
import { GetServerSideProps } from 'next'
import PhotoInterface from '../types/photo'
import GalleryWrapper from '../components/GalleryWrapper'
import AppBar from '../components/AppBar'

export default function Show(props: {photos: PhotoInterface[]}) {
  return (
    <div>
      <AppBar />
      <GalleryWrapper photos={props.photos} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (typeof context.query.ids === "string") {
    const ids = context.query.ids.split(',')
    const images = []
    for (const id of ids) {
      const img_data = await db_ops.image_ops.find_image_by_id(parseInt(id))
      if (img_data) { images.push(img_data) }
    }
    const photos = []
    for (const image of images) {
      photos.push({
        src: `/thumbnails/${image.id}.jpg`,
        key: `/image/${image.id}`,
        width: image.width as number,
        height: image.height as number,
        title:image.caption
      })
    }
    if (photos.length !== 0) {
      return {
        props: {
          photos: photos
        }
      }
    }

  }
  return {
    props: { notFound: true }
  }
}