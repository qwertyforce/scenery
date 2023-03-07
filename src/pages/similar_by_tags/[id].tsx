import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import { GetServerSideProps } from 'next'
import GalleryWrapper from '../../components/GalleryWrapper'
import PhotoInterface from '../../types/photo'
import Footer from '../../components/Footer'

export default function SimilarByTags(props: { photos: PhotoInterface[] }) {
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
    const image_id = context.params.id
    const x = await db_ops.image_ops.get_images_with_similar_tags(parseInt(image_id), 100)
    const similar_images = x.map((el) => {
      return {
        id: el["_id"].id,
        width: el["_id"].width,
        height: el["_id"].height,
        caption: el["_id"].caption,
      }
    })
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
  return {
    notFound: true
  }
}

