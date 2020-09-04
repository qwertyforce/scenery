import React from "react";
import Gallery from "react-photo-gallery";
import { photos } from "./photos";
import dynamic from 'next/dynamic'

/* popout the browser and maximize to see more rows! -> */
const NoSsr = () => (
  <Gallery photos={photos} />
)
export default NoSsr