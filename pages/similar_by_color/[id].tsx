import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import db_ops from '../../server/helpers/db_ops'
import { GetStaticPaths,GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import Photo from '../../components/Photo'
import Link from '../../components/Link'
import ErrorPage from 'next/error'
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

interface  Similarity{
  id:number,
  similarity:number
}

interface Similarities{
  id: number,
  similarities:Similarity[];
}

export const getStaticProps: GetStaticProps = async (context) => {
  const images_on_page = 120
  const photos = []
  if (typeof context.params?.id === "string") {
    const id = parseInt(context.params.id)
    const similarities_by_color:Array<Similarities> = await db_ops.image_search.get_color_similarities_by_id(id)
    if (similarities_by_color.length !== 0) {
      const similar_by_color=similarities_by_color[0]
      const similar_images = similar_by_color.similarities.filter((el: Similarity) => el.similarity > 0.2).sort((a, b) => b.similarity - a.similarity).slice(0, images_on_page)
      for (const img of similar_images) {
        const image = (await db_ops.image_ops.find_image_by_id(img.id))[0]
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

