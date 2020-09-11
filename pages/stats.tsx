import React from 'react';
import db_ops from '../server/helpers/db_ops'
import AppBar from '../components/AppBar'
import {GetStaticProps} from 'next'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Index(props:any) {
  return (
    <div>
      <AppBar/>
      <div>Total Images: {props.number_of_images}</div>
      <div>Total Authors: {props.number_of_authors}</div>
      <div>Total tags: {props.number_of_tags}</div>
      </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
   const imgs=await db_ops.image_ops.get_all_images()
   const authors=new Set()
   const tags=new Set()
   for(const img of imgs){
     authors.add(img.author)
     for (const tag of img.tags){
       tags.add(tag)
     }
   }
   return {
    props:{
      number_of_images:imgs.length,
      number_of_authors:authors.size,
      number_of_tags:tags.size,
    }
  }
} 
 