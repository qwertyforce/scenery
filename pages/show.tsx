import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import config from '../config/config'
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import { useRouter } from 'next/router'
import Photo from '../components/Photo'
import ErrorPage from 'next/error'
const useStyles = makeStyles(() => ({
  pagination:{
    display:"flex",
    justifyContent:'center'
  }
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Show(props:any){
  const classes = useStyles();
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div>
      <AppBar/>
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
    const images:Array<Record<string,unknown>>=[]
    for(const id of ids){
      const img_data=await db_ops.image_ops.find_image_by_id(parseInt(id))
      images.push(img_data[0])
    }
    const photos=[]
    for (const image of images){
      photos.push({
        src: `${config.domain}/images/${image.id}.${image.file_ext}`,
        key: `${config.domain}/image/${image.id}`,
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
    props: { err: true }, // will be passed to the page component as props
  }
}