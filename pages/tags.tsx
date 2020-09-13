import React from 'react';
import db_ops from '../server/helpers/db_ops'
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../components/AppBar'
import {GetStaticProps} from 'next'
import Chip from '@material-ui/core/Chip';



const useStyles = makeStyles(() => ({
  chip: {
    margin: 5
  }
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Index(props:any) {
  const classes = useStyles();
  const Tags = props.tags.map((tag:string) => <Chip label={tag} key={tag} className={classes.chip} component="a" href={`/search?q=${tag}`} clickable />);
  return (
    <div>
      <AppBar/>
      {Tags}
      </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
   const imgs=await db_ops.image_ops.get_all_images()
   const tags=new Set()
   for(const img of imgs){
     for (const tag of img.tags){
       tags.add(tag)
     }
   }
   return {
    props:{
      tags:[...tags].sort(),
    }
  }
} 
 