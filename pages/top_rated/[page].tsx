/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../../components/AppBar'
import { Tab, Tabs } from "@material-ui/core";
import db_ops from '../../server/helpers/db_ops'
import Pagination from '@material-ui/lab/Pagination';
import { GetStaticPaths } from 'next'
import { useRouter } from 'next/router'
import Photo from '../../components/Photo'
import Link from '../../components/Link'
import ErrorPage from 'next/error'
import PaginationItem from "@material-ui/lab/PaginationItem/PaginationItem";

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
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
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
      <Tabs
        value={1}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab href="/last_added/1" label="Last Added" {...a11yProps(0)} />
        <Tab href="/top_rated/1" label="Top Rated"  {...a11yProps(1)} />
      </Tabs>

      {/* 
  // @ts-ignore */ }
      <Gallery targetRowHeight={250} photos={props.photos} renderImage={Photo} />   {/* FIX THIS SHIT */}
      <div className={classes.pagination}>
        {/* // @ts-ignore */}
        <Pagination count={props.max_page} defaultPage={props.current_page} renderItem={(item) => {
          {/* 
// @ts-ignore */ }
          return (<PaginationItem
            component={Link}
            href={`/top_rated/${item.page}`}
            underline="none"
            {...item}
          />)
        }
        } siblingCount={3} color="primary" size="large" />
      </div>
      <div className={classes.footer}>
        <Link href='/about'>About&nbsp;</Link>
        <Link href='/stats'>Stats&nbsp;</Link>
        <Link href='/tags'>Tags</Link>
      </div>
    </div>

  )
}

export async function getStaticProps(context: any) {
  const images_on_page = 30
  const photos = []
  if (context.params.page) {
    const images = (await db_ops.image_ops.get_all_images()).sort((a, b) => b.wilson_score - a.wilson_score)
    const page = parseInt(context.params.page)
    if (page >= 1 && page <= Math.ceil(images.length / images_on_page)) {
      for (let i = (page - 1) * images_on_page; (i < (page) * images_on_page) && (i < images.length); i++) {
        photos.push({
          src: `/webp_images/${images[i].id}.webp`,
          key: `/image/${images[i].id}`,
          width: images[i].width,
          height: images[i].height
        })
      }
      return {
        props: {
          photos: photos,
          current_page: page,
          max_page: Math.ceil(images.length / images_on_page)
        },
        revalidate: 5 * 60 //5 min
      }
    }
  }
  return {
    props: {err: true},
    revalidate: 5*60 //5 min
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const images = await db_ops.image_ops.get_all_images()
  const images_on_page = 30
  const paths = []
  for (let i = 1; i <= Math.ceil(images.length / images_on_page); i++) {
    paths.push({ params: { page: i.toString() } })
  }
  return {
    paths: paths,
    fallback: true
  };
}
export default MainPage

