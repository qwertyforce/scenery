import React from "react";
import Gallery from "react-photo-gallery";
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Photo from '../components/Photo'
import ErrorPage from 'next/error'


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Show(props: any) {
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div>
      <AppBar />
      {/* 
  // @ts-ignore */ }
      <Gallery targetRowHeight={250} photos={props.photos} renderImage={Photo} />   {/* FIX THIS SHIT */}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  if (context.query.ids) {
    const ids = context.query.ids.split(',')
    const images: Array<Record<string, unknown>> = []
    for (const id of ids) {
      const img_data = await db_ops.image_ops.find_image_by_id(parseInt(id))
      if(img_data[0]){images.push(img_data[0])}
    }
    const photos = []
    for (const image of images) {
      photos.push({
        src: `/webp_images/${image.id}.webp`,
        key: `/image/${image.id}`,
        width: image.width,
        height: image.height
      })
    }
    if(photos.length!==0){
      return {
        props: {
          photos: photos
        }
      }
    }
    
  }
  return {
    props: { err: true }, // will be passed to the page component as props
  }
}