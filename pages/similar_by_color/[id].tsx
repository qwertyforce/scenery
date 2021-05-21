/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import image_ops from '../../server/helpers/image_ops'
import {GetServerSideProps} from 'next'
import Photo from '../../components/Photo'
import Link from '../../components/Link'
import PhotoInterface from '../../types/photo'

const useStyles = makeStyles(() => ({
  pagination: {
    display: "flex",
    justifyContent: 'center'
  },
  footer: {
    display: "flex",
    justifyContent: "center"
  }
}));

interface SimilarByColorProps{
  photos: PhotoInterface,
  current_page: number,
  max_page: number,
  err:boolean
}

export default function SimilarByColor(props: SimilarByColorProps){
  const classes = useStyles();
  return (
    <div>
      <AppBar />
      {/* 
  // @ts-ignore */ }
      <Gallery targetRowHeight={250} photos={props.photos} renderImage={Photo} />   {/* FIX THIS SHIT */}
      <div className={classes.footer}>
        <Link href='/about'>About&nbsp;</Link>
        <Link href='/stats'>Stats&nbsp;</Link>
        <Link href='/tags'>Tags</Link>
      </div>
    </div>

  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const photos = []
  if (typeof context.params?.id === "string") {
    const similar_images_ids = await image_ops.hist_get_similar_images_by_id(parseInt(context.params.id))
    // console.log(similar_images_ids)
    if (similar_images_ids) {
      const similar_images = []
      for (const image_id of similar_images_ids) {
        const img = await db_ops.image_ops.find_image_by_id(image_id)
        if (img) {
          similar_images.push({ id: img.id, width: img.width, height: img.height })
        }
      }
      for (const image of similar_images) {
        photos.push({
          src: `/thumbnails/${image.id}.jpg`,
          key: `/image/${image.id}`,
          width: image.width,
          height: image.height
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


