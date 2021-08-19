import React, { Fragment, useContext, useEffect, useState } from 'react'
import PhotoInterface from "./../types/photo"
import Gallery from "react-photo-gallery"
import { DataContext } from "./DataContext"
import Photo from './Photo'
import CircularProgress from '@material-ui/core/CircularProgress'

export default function GalleryWrapper(props: { photos: PhotoInterface[] }) {
  const [photos, setPhotos] = useState<PhotoInterface[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const dataContext = useContext(DataContext)

  useEffect(() => {
    if (props.photos.length !== 0) {
      if (dataContext?.useIPFS) {
        console.log(`typeof window !== "undefined" ${typeof window !== "undefined"}`)
        const _photos = []
        for (const photo of props.photos) {//"https://ipfs.io/ipns/ipns.scenery.cx"
          const new_photo = { src: `http://127.0.0.1:8080/ipns/${process.env.ipns}${photo.src}`, key: photo.key, width: photo.width, height: photo.height }
          _photos.push(new_photo)
        }
        setPhotos(_photos)
      } else {
        setPhotos(props.photos)
      }
      setShowLoading(false)
    }
  }, [dataContext])

  return (
    <Fragment>
      <div style={{ display: (showLoading) ? "flex" : "none", justifyContent: "center" }}> <CircularProgress /> </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Gallery targetRowHeight={200} photos={photos} renderImage={(Photo as any)} />
    </Fragment>
  )
}