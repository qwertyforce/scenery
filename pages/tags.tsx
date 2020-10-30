import React from 'react';
import db_ops from '../server/helpers/db_ops'
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../components/AppBar'
import { GetStaticProps } from 'next'
import Chip from '@material-ui/core/Chip';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  chip: {
    margin: 5
  }
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Tags(props: any) {
  const classes = useStyles();
  const Mane6=['rarity',"applejack","twilight sparkle","fluttershy","rainbow dash","pinkie pie"]
  const Tags=[]
  const Mane6_tags=[]
  for(const [tag_name,number_of_pictures] of props.tags){
    const tag=<Chip label={`${tag_name} (${number_of_pictures})`} key={tag_name} className={classes.chip} component="a" href={`/search?q=${tag_name}`} clickable />
    if(Mane6.includes(tag_name)){
      Mane6_tags.push(tag)
    }else{
      Tags.push(tag)
    }
  }
  return (
    <div>
      <AppBar />
      <Typography variant="h6" gutterBottom>
        Mane 6
      </Typography>
      {Mane6_tags}
      <Typography variant="h6" gutterBottom>
        Other
      </Typography>
      {Tags}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const imgs = await db_ops.image_ops.get_all_images() 
  const filter_tag=(tag:string)=>{
    const filtered_tags=["width:","height:","artist:"]
     for(const f_tag of filtered_tags){
       if(tag.includes(f_tag)){
         return false
       }
     }
     return true
  }
  const tags = new Map()
  for (const img of imgs) {
    for (const tag of img.tags) {
      tags.set(tag,tags.get(tag)+1||1)
    }
  }
  const filtered_tags=[...tags].filter(([tag_name])=>filter_tag(tag_name))
  return {
    props: {
      tags: filtered_tags.sort(),
    },
    revalidate: 6 * 50 //5 min
  }
}
