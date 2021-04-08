/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Pagination from '@material-ui/lab/Pagination';
import Photo from '../components/Photo'
import Link from '../components/Link'
import PaginationItem from "@material-ui/lab/PaginationItem/PaginationItem";
import PhotoInterface from '../types/photo'
import axios from "axios"
import config from "../config/config"
import build_ast from "../components/parse"

const useStyles = makeStyles(() => ({
  pagination: {
    display: "flex",
    justifyContent: 'center'
  }
}));

interface SearchProps{
  err:boolean,
  total_images:number,
  photos:PhotoInterface[],
  search_query:string,
  current_page:number,
  max_page:number
}
export default function Search(props: SearchProps) {
  const classes = useStyles();
  if (props.err) {
    return (<div>
      <AppBar />
      <p>Total images: 0</p>
    </div>)
  }
  return (
    <div>
      <AppBar />
      <p>Total images: {props.total_images}</p>
      {/* 
      // @ts-ignore */ }
      <Gallery targetRowHeight={250} photos={props.photos} renderImage={Photo} />   {/* FIX THIS SHIT */}
      <div className={classes.pagination}>
        {/* 
        // @ts-ignore */}
        <Pagination count={props.max_page} defaultPage={props.current_page} renderItem={(item) => {
          {/* 
          // @ts-ignore */ }
          return (<PaginationItem
            component={Link}
            href={`/search?q=${encodeURIComponent(props.search_query)}&page=${item.page}`}
            underline="none"
            {...item}
          />)
        }
        } siblingCount={3} color="primary" size="large" />
      </div>
    </div>

  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  if (typeof context.query.q === "string") {
    if (context.query.q.includes("$")) {  //anti - nosql injection or something
      return {
        props: { err: true }
      }
    }
    console.log([context.query.q,context.query.semantic])
    const photos:PhotoInterface[] = []
    if(context.query.semantic==="1"){
      const images = await db_ops.image_ops.find_images_by_tags(context.query.q)
      if(context.query.q.length>100){
        return {
          props: { err: true }
        }
      }
      try{
        const found_images=[]
        const res = await axios.post(`${config.nn_microservice_url}/find_similar_by_text`,{query:context.query.q})
        for(const image of images){
          if (res.data.includes(image.id.toString())){
            found_images.push({
              src: `/thumbnails/${image.id}.jpg`,
              key: `/image/${image.id}`,
              width: image.width,
              height: image.height
            })
          }
        }
        return {
          props: {
            total_images:found_images.length,
            photos: found_images,
            search_query: context.query.q,
            current_page: 1,
            max_page: 1
          }
        }
      }catch(e){
        console.log(e)
      }
    }
    
    const query = build_ast(context.query.q)
    if (query.error) {
      return {
        props: { err: true }
      }
    }
    const images = await db_ops.image_ops.find_images_by_tags(query)
    const images_on_page = 30
    let page:number;
    if (context.query.page) {
      page = parseInt(context.query.page)
    } else {
      page = 1
    }
    page = Math.max(page, 1)
    if (page <= Math.ceil(images.length / images_on_page)) {
      for (let i = (page - 1) * images_on_page; (i < (page) * images_on_page) && (i < images.length); i++) {
        photos.push({
          src: `/thumbnails/${images[i].id}.jpg`,
          key: `/image/${images[i].id}`,
          width: images[i].width,
          height: images[i].height
        })
      }
      return {
        props: {
          total_images:images.length,
          photos: photos,
          search_query: context.query.q,
          current_page: page,
          max_page: Math.ceil(images.length / images_on_page)
        }
      }
    }
  }
  return {
    props: { err: true }
  }
}