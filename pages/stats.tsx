import React from 'react';
import db_ops from '../server/helpers/db_ops'
import AppBar from '../components/AppBar'
import { GetStaticProps } from 'next'

interface StatsProps {
  number_of_images: number,
  number_of_authors: number,
  number_of_tags: number,
  number_of_deleted: number,
  last_image_id: number
}

export default function Stats(props: StatsProps) {
  return (
    <div>
      <AppBar />
      <div>Total Images: {props.number_of_images}</div>
      <div>Total Authors: {props.number_of_authors}</div>
      <div>Total Tags: {props.number_of_tags}</div>
      <div>Images deleted: {props.number_of_deleted}</div>
      <div>ID of the last image: {props.last_image_id}</div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const number_of_images = await db_ops.image_ops.get_number_of_images_returned_by_search_query({})
  const number_of_unique_tags = await db_ops.image_ops.get_number_of_unique_tags()
  const number_of_unique_authors = await db_ops.image_ops.get_number_of_unique_authors()
  const last_image_id=await db_ops.image_ops.get_max_image_id()
  return {
    props: {
      number_of_images: number_of_images,
      number_of_authors: number_of_unique_authors,
      number_of_tags: number_of_unique_tags,
      number_of_deleted: last_image_id - number_of_images,
      last_image_id: last_image_id
    },
    revalidate: 5 * 60 //5 min
  }
}
