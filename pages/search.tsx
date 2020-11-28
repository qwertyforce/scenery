/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Gallery from "react-photo-gallery";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '../components/AppBar'
import db_ops from '../server/helpers/db_ops'
import Pagination from '@material-ui/lab/Pagination';
import Photo from '../components/Photo'
import Link from '../components/Link'
import ErrorPage from 'next/error'
import PaginationItem from "@material-ui/lab/PaginationItem/PaginationItem";

const useStyles = makeStyles(() => ({
  pagination: {
    display: "flex",
    justifyContent: 'center'
  }
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Search(props: any) {
  const classes = useStyles();
  if (props.err) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div>
      <AppBar />
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
            href={`/search?q=${props.search_query}&page=${item.page}`}
            underline="none"
            {...item}
          />)
        }
        } siblingCount={3} color="primary" size="large" />
      </div>
    </div>

  )
}


function parse(query:string) {
  const operators: any = []
  const operands: any = []
  const priority: any = {
    "!": 3,
    "&&": 2,
    "||": 1
  }
  function operate(operator: string, a: any, b: any = 0) {
    if(a===undefined || b===undefined){
      return {error:true}
    }
    let x = {}
    switch (operator) {
      case "||":
        x = { '$or': [a, b] }
        break;
      case "&&":
        x = { '$and': [a, b] }
        break;
      case "!":
        x = { '$nor': [a] }
        break;
    }
    return x
  }
  function x(operator: string) {
    while (operators.length > 0 && operators[operators.length - 1] !== "(" && priority[operators[operators.length - 1]] >= priority[operator]) {
      const last_operator = operators.pop()
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
    operators.push(operator)
  }

  function execute_until_opening_bracket() {
    while (operators.length > 0) {
      const last_operator = operators.pop()
      if (last_operator === "(") {
        break;
      }
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
  }
  function execute_remaining() {
    while (operators.length > 0) {
      const last_operator = operators.pop()
      if (last_operator === ")" || last_operator === "(") {
        continue;
      }
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
  }

  function split(str:any) {
    const tokens = ["&&", "||", "!", "(", ")", ",","-"]
    const temp_char = "#$#"
    for (const token of tokens) {
      str = str.replaceAll(token, temp_char + token + temp_char)
    }
    str = str.split(temp_char).map((el:any)=>el.trim()).filter((el:any) => el !== "")
    return str;
  }

  const query_splitted = split(query)
  for (const word of query_splitted) {
    switch (word) {
      case "||":
        x("||")
        break;
      case ",":
      case "&&":
        x("&&")
        break;
      case "-":
      case "!":
        x("!")
        break;
      case "(":
        operators.push("(")
        break;
      case ")":
        execute_until_opening_bracket()
        break;
      default:
        operands.push({ tags: word })
        break;
    }
  }
  execute_remaining()
  if(operands.length!==1 || operators.length!==0){
    return {error:true}
  }else{
    return operands[0]
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServerSideProps(context: any) {
  if (context.query.q) {
    if(context.query.q.includes("$")){
      return {
        props: { err: true } 
      }
    }
    console.log(context.query.q)
    const query=parse(context.query.q)
    if(query.error){
      return {
        props: { err: true } 
      }
    }
    const images = await db_ops.image_ops.find_images_by_tags(query)
    const images_on_page = 30
    const photos = []
    let page;
    if (context.query.page) {
      page = parseInt(context.query.page)
    } else {
      page = 1
    }
    page = Math.max(page,1)
    if (page <= Math.ceil(images.length / images_on_page)) {
      for (let i = (page - 1) * images_on_page; (i < (page) * images_on_page) && (i < images.length); i++) {
        photos.push({
          src: `/thumbnails/${images[i].id}.jpg`,
          key: `/image/${images[i].id}`,
          width: images[i].width,
          height: images[i].height
        })
      }
      return {
        props: {
          photos: photos,
          search_query: context.query.q,
          current_page: page,
          max_page: Math.ceil(images.length / images_on_page)
        }
      }
    }
  }
  return {
    props: { err: true } 
  }
}