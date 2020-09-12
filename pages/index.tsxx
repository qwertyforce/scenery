import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import config from '../config/config'
import AppBar from '../components/AppBar'
import { Tab, Tabs } from "@material-ui/core";
import db_ops from '../server/helpers/db_ops'
import Pagination from '@material-ui/lab/Pagination';

const useStyles = makeStyles(() => ({
  pagination:{
    display:"flex",
    justifyContent:'center'
  }
}));
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
const MainPage = (props: { photos: { src: string; srcSet?: string | string[] | undefined; sizes?: string | string[] | undefined; width: number; height: number; alt?: string | undefined; key?: string | undefined; }[]; }) =>{
  const classes = useStyles();
  return (
    <div>
      <AppBar/>
    <Tabs 
            value={0}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="full width tabs example"
          >
            <Tab label="Last Added" {...a11yProps(0)}  />
            <Tab label="Top Rated"  {...a11yProps(1)} />
            </Tabs>
    <Gallery targetRowHeight={250} photos={props.photos} onClick={(_e,photos)=>window.open(photos.photo.key, '_blank')}/>
    <div className={classes.pagination}><Pagination count={10} color="primary" size="large" /></div>
</div>
  
  )
} 
export async function getStaticProps() {
  const photos = []
  let images = await db_ops.image_ops.get_all_images()
  images.length = 30
  for (const image of images) {
    photos.push({
      src: `${config.domain}/images/${image.id}.${image.file_ext}`,
      key:`${config.domain}/image/${image.id}`,
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
// import dynamic from 'next/dynamic'
// export default dynamic(() => Promise.resolve(NoSsr), {
//   ssr: false
// })
export default MainPage