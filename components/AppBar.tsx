import React, { useState } from 'react';
import { fade,makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';
import Link from './Link'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import ImageSearchIcon from '@material-ui/icons/ImageSearch';
import { IconButton } from '@material-ui/core';
import config from '../config/config'

import { useRouter } from 'next/router'

const useStyles = makeStyles((theme) => ({
  app_bar:{
    backgroundColor:"#606ca9"
  },
  root: {
    flexGrow: 1,
    marginBottom:'10px'
  },
  tool_bar:{
   minHeight:"36px!"
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  }
}));

export default function DenseAppBar(props:any) {
  const classes = useStyles();
  const router = useRouter()
  const [tags, setTags] = useState(router.query.q||'');
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
       router.push(`${config.domain}/search?q=${encodeURIComponent((tags as string))}`)
    }
  };

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.app_bar}>
        <Toolbar variant="dense" className={classes.tool_bar}>
          <Typography variant="h6" color="inherit">
          <Link href={config.domain} color="inherit" underline="none">
             OnlyComfy
           </Link>
          </Typography>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="tag1&&(tag2||tag3)"
              onChange={(e)=>setTags(e.target.value)}
              onKeyPress={(e)=>handleKeyPress(e)}
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              value={tags}
            />
          </div>
          <IconButton  component={Link} color="inherit" aria-label="search_syntax" href={`${config.domain}/search_syntax`}>
            <HelpOutlineIcon />
          </IconButton>
          <IconButton  component={Link} color="inherit" aria-label="reverse_search" href={`${config.domain}/reverse_search`}>
            <ImageSearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
}