import AppBar from '../../components/AppBar'
import { GetServerSideProps } from 'next'
import GalleryWrapper from '../../components/GalleryWrapper'
import Footer from '../../components/Footer'
import db_ops from '../../server/helpers/db_ops'
import PhotoInterface from '../../types/photo'
import image_ops from "../../server/helpers/image_ops"

export default function VisuallySimilar(props: { photos: PhotoInterface[] }) {
  return (
    <div>
      <AppBar />
      <GalleryWrapper photos={props.photos} />
      <Footer />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const photos = []
  if (typeof context.params?.id === "string") {
    const similar_images_ids = await image_ops.image_text_features_get_similar_images_by_id(parseInt(context.params.id))
    // console.log(similar_images_ids)
    if (similar_images_ids) {
      const similar_images = []
      for (const image_id of similar_images_ids) {
        const img = await db_ops.image_ops.find_image_by_id(image_id)
        if (img) {
          similar_images.push({ id: img.id, width: img.width, height: img.height,caption:img.caption })
        }
      }
      for (const image of similar_images) {
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
          photos: photos
        }
      }
    }
  }
  return {
    notFound: true
  }
}
