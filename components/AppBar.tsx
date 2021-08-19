import { useContext, useState } from 'react'
import { alpha, makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import SearchIcon from '@material-ui/icons/Search'
import InputBase from '@material-ui/core/InputBase'
import Link from './Link'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import ImageSearchIcon from '@material-ui/icons/ImageSearch'
import { IconButton } from '@material-ui/core'
import Switch from '@material-ui/core/Switch'
import { useRouter } from 'next/router'
import MoreIcon from '@material-ui/icons/MoreVert'
import MenuItem from '@material-ui/core/MenuItem'
import Menu from '@material-ui/core/Menu'
import { DataContext } from "./DataContext"

const useStyles = makeStyles((theme) => ({
  app_bar: {
    backgroundColor: "#606ca9"
  },
  root: {
    flexGrow: 1,
    marginBottom: '10px',
    marginRight: "0px"
  },
  tool_bar: {
    paddingRight: "6px",
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: "0px",
    width: 'auto',
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
  switch: {
    display: "inline-flex",
    alignItems: "center"
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
    },
  },
  sub: {
    verticalAlign: "baseline",
    position: 'relative',
    top: "0.5em",
    left: "0.05em",
  },
  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
    },
  },
  sectionMobile: {
    display: 'flex',
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  Logo: {
    marginRight: "16px",
    display: "inherit",
    [theme.breakpoints.down(350)]: {
      display: 'none',
    }
  }
}))


function Search(props: { semanticModeChecked: boolean }) {
  const placeholders = ["tag1&&(tag2||tag3)", "a picture of a winter forest"]
  const classes = useStyles()
  const router = useRouter()
  const [tags, setTags] = useState(router.query.q || '')
  const searchPlaceholer = placeholders[Number(router.query.semantic || Number(props.semanticModeChecked))]
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      router.push(`${process.env.domain}/search?q=${encodeURIComponent((tags as string))}&semantic=${Number(props.semanticModeChecked).toString()}`)
    }
  }

  return (
    <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon />
      </div>
      <InputBase
        placeholder={searchPlaceholer}
        onChange={(e) => setTags(e.target.value)}
        onKeyPress={(e) => handleKeyPress(e)}
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput,
        }}
        inputProps={{ 'aria-label': 'search' }}
        value={tags}
      />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MobileMenu(props: any) {
  const classes = useStyles()
  return (
    <Menu
      anchorEl={props.mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={'menu-mobile'}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={props.isMobileMenuOpen}
      onClose={props.handleMobileMenuClose}
    >
      <MenuItem className={classes.sectionMobile} component={Link} color="inherit" aria-label="search_syntax" href={`${process.env.domain}/search_syntax`}>
        <HelpOutlineIcon />
        <p style={{ paddingLeft: "5px" }}>Search syntax</p>
      </MenuItem>
      <MenuItem className={classes.sectionMobile}>
        <div className={classes.switch}>
          <span>tags</span>
          <Switch color="secondary" checked={props.semanticModeChecked} onChange={props.toggleSemanticModeChecked} />
          <span>semantic<sub className={classes.sub}>beta</sub></span>
        </div>
      </MenuItem>
      <MenuItem className={classes.sectionMobile} component={Link} color="inherit" aria-label="reverse_search" href={`${process.env.domain}/reverse_search`}>
        <ImageSearchIcon />
        <p style={{ paddingLeft: "5px" }}>Reverse Image Search</p>
      </MenuItem>
      <MenuItem>
        <div className={classes.switch}>
          <span>use ipfs</span>
          <Switch color="secondary" checked={props.dataContext?.useIPFS} onChange={props.dataContext?._handleSwitchUseIPFS} />
        </div>
      </MenuItem>
    </Menu>
  )
}

export default function DenseAppBar() {
  const dataContext = useContext(DataContext)
  const classes = useStyles()
  const router = useRouter()
  const mobileMenuId = 'menu-mobile'
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<Element | null>(null)

  const [semanticModeChecked, setSemanticModeChecked] = useState(Boolean(Number(router.query.semantic)) || false)
  const toggleSemanticModeChecked = () => {
    setSemanticModeChecked(!semanticModeChecked)
  }

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setMobileMoreAnchorEl(event.currentTarget)
  }

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null)
  }

  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl)
  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.app_bar}>
        <Toolbar variant="dense" className={classes.tool_bar}>
          <Typography variant="h6" color="inherit" className={classes.Logo}>
            <Link href={process.env.domain} color="inherit" underline="none">
              Scenery
           </Link>
          </Typography>
          <Search semanticModeChecked={semanticModeChecked} />
          <div className={classes.sectionDesktop}>
            <div className={classes.switch}>
              <span>tags</span>
              <Switch color="secondary" checked={semanticModeChecked} onChange={toggleSemanticModeChecked} />
              <span>semantic<sub className={classes.sub}>beta</sub></span>
            </div>
            <IconButton component={Link} color="inherit" aria-label="search_syntax" href={`${process.env.domain}/search_syntax`}>
              <HelpOutlineIcon />
            </IconButton>
            <IconButton component={Link} color="inherit" aria-label="reverse_search" href={`${process.env.domain}/reverse_search`}>
              <ImageSearchIcon />
            </IconButton>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <IconButton
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
      <MobileMenu {...{ dataContext, semanticModeChecked, mobileMoreAnchorEl, isMobileMenuOpen, handleMobileMenuClose, toggleSemanticModeChecked }} />
    </div>
  )
}