import React from "react";
import Gallery from "react-photo-gallery";
import config from '../config/config'
import AppBar from '../components/AppBar'
import fs from 'fs'
import { Tab, Tabs } from "@material-ui/core";
/* popout the browser and maximize to see more rows! -> */
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
const NoSsr = (props) => (
  <div><AppBar/>
  <Tabs 
          value={0}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="full width tabs example"
        >
          <Tab label="Last Added" {...a11yProps(0)}  />
          <Tab label="Top Rated"  {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
  <Gallery targetRowHeight={250} photos={props.photos} /></div>

)
export async function getStaticProps(context) {
  return {
    props: {photos:[
      {
        src: `${config.domain}/images/3.png`,
        width: 1680,
        height: 1050
      },
      {
        src: `${config.domain}/images/23.png`,
        width: 1680,
        height: 1050
      },
      {
        src: `${config.domain}/images/25.png`,
        width: 1980,
        height: 1238
      },
      {
        src: `${config.domain}/images/27.png`,
        width: 1900,
        height: 1200
      },
      {
        src: `${config.domain}/images/28.jpg`,
        width: 1600,
        height: 2244
      },
      {
        src: `${config.domain}/images/29.jpg`,
        width: 1920,
        height: 1080
      },
      {
        src: `${config.domain}/images/147.jpg`,
        width: 720,
        height: 960
      },
      {
        src: `${config.domain}/images/201.png`,
        width: 1400,
        height: 811
      }
      
    ]}, // will be passed to the page component as props
  }
}
// import dynamic from 'next/dynamic'
// export default dynamic(() => Promise.resolve(NoSsr), {
//   ssr: false
// })
export default NoSsr