/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import GalleryWrapper from '../components/GalleryWrapper'
import ErrorPage from 'next/error'
import PhotoInterface from '../types/photo'
interface ShowProps {
  photos: PhotoInterface[],
  err: boolean
}

export default function Show(props: ShowProps) {
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div>
      <AppBar />
      <GalleryWrapper photos={props.photos} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  if (context.query.ids) {
    const ids = context.query.ids.split(',')
    const images = []
    for (const id of ids) {
      const img_data = await db_ops.image_ops.find_image_by_id(parseInt(id))
      if (img_data) { images.push(img_data) }
    }
    const photos: PhotoInterface[] = []
    for (const image of images) {
      photos.push({
        src: `/thumbnails/${image.id}.jpg`,
        key: `/image/${image.id}`,
        width: image.width as number,
        height: image.height as number
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
    props: { err: true }, // will be passed to the page component as props
  }
}