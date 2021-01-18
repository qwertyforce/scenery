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
  const imgs = await db_ops.image_ops.get_all_images()
  const authors = new Set()
  const tags = new Set()
  const id_of_last_image = imgs[imgs.length - 1].id
  for (const img of imgs) {
    authors.add(img.author)
    for (const tag of img.tags) {
      tags.add(tag)
    }
  }
  return {
    props: {
      number_of_images: imgs.length,
      number_of_authors: authors.size,
      number_of_tags: tags.size,
      number_of_deleted: id_of_last_image - imgs.length,
      last_image_id: id_of_last_image
    },
    revalidate: 5 * 60 //5 min
  }
}
