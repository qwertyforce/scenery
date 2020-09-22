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
 
export async function getStaticProps(context: any) {
  const images_on_page = 120
  const photos = []
  if (context.params.id) {
    const id=parseInt(context.params.id)
    let similar_by_color:Array<Record<string,any>>=(await db_ops.image_search.get_color_similarities_by_id(id)).filter((el:any)=>el.similarity>0.2)
    similar_by_color.sort((a,b)=>b.similarity-a.similarity)
    similar_by_color=similar_by_color.slice(0,images_on_page)
    for(const img of similar_by_color){
      const image = (await db_ops.image_ops.find_image_by_id(img.id))[0]
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

