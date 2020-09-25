/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import { GetStaticPaths } from 'next'
import { useRouter } from 'next/router'
import Photo from '../../components/Photo'
import Link from '../../components/Link'
import ErrorPage from 'next/error'

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
async function get_similarity(orig_tags: Array<string>, img_tags: Array<string>) {
  let similarity = 0
  for (const tag of orig_tags) {
    if (img_tags.includes(tag)) {
      similarity += 1
    }
  }
  return similarity
}
export async function getStaticProps(context: any) {
  const images_on_page = 30
  const photos = []
  let similar_by_tags = []
  if (context.params.id) {
    const images = await db_ops.image_ops.get_all_images()
    const orig_tags = (images.find((el) => el.id.toString() === context.params.id))?.tags
    if (orig_tags) {
      for (const image of images) {
        if (image.id.toString() !== context.params.id) {
          similar_by_tags.push({ id: image.id, file_ext: image.file_ext, width: image.width, height: image.height, similarity: await get_similarity(orig_tags, image.tags) })
        }
      }
      similar_by_tags.sort((a, b) => b.similarity - a.similarity)
      similar_by_tags = similar_by_tags.slice(0, images_on_page)
      for (const image of similar_by_tags) {
        photos.push({
          src: `/webp_images/${image.id}.webp`,
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

