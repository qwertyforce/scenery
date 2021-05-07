/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import { GetServerSideProps } from 'next'
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
interface SimilarByTagsProps{
  photos:PhotoInterface,
  err:boolean
}
export default function SimilarByTags(props: SimilarByTagsProps){
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
    const image_id=context.params.id
    const x = await db_ops.image_ops.get_images_with_similar_tags(parseInt(image_id), 30)
    const similar_images = x.map((el) => {
      return {
        id: el["_id"].id,
        width: el["_id"].width,
        height: el["_id"].height
      }
    })
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
  return {
    notFound: true
  }
}

 