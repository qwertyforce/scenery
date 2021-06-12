import {makeStyles } from '@material-ui/core/styles';
import Link from './Link'
import config from '../config/config'
const useStyles = makeStyles(() => ({
  footer: {
    display: "flex",
    justifyContent: "center"
  }
}));

export default function Footer() {
  const classes = useStyles();
  return (
    <div>
    <div className={classes.footer}>
      <Link href={config.api_domain}>API&nbsp;</Link>
      <Link href='/stats'>Stats&nbsp;</Link>
      <Link href='/tags'>Tags&nbsp;</Link>
      <Link href='/about'>About&nbsp;</Link>
    </div>
    <div className={classes.footer}>
      Powered by&nbsp;<Link href='https://github.com/qwertyforce/scenery'>scenery</Link>
    </div>
    </div>
  );
}