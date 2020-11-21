/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import { GetStaticPaths } from 'next'
import { useRouter } from 'next/router'
import Photo from '../../components/Photo'
import Link from '../../components/Link'
import ErrorPage from 'next/error'
import db_ops from '../../server/helpers/db_ops'
import {promises as fs } from 'fs'

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MainPage = (props: any) => {
  const classes = useStyles();
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

export async function getStaticProps(context: any) {
  const photos = []
  if (context.params.id) {
    let all_images_similaties: any = await fs.readFile("find_visually_similar_images/data.txt", "utf-8")
    all_images_similaties = JSON.parse(all_images_similaties)
    const similar_images_ids = all_images_similaties[(context.params.id as string)]
    if (similar_images_ids) {
      const similar_images = []
      for (const image_id of similar_images_ids) {
        const img = (await db_ops.image_ops.find_image_by_id(parseInt(image_id)))[0]
        if(img){
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
        },
        revalidate: 5 * 60 //5 min
      }
    }
  }
  
  return {
    props: { err: true },
    revalidate: 5 * 60 //5 min
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const images = await db_ops.image_ops.get_all_images()
  const paths = []
  for (const image of images) {
    paths.push({ params: { id: image.id.toString() } })
  }
  return {
    paths: paths,
    fallback: true
  };
}
export default MainPage

