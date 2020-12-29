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
    <div className={classes.footer}>
      <Link href='/about'>About&nbsp;</Link>
      <Link href={config.api_domain}>API&nbsp;</Link>
      <Link href='/stats'>Stats&nbsp;</Link>
      <Link href='/tags'>Tags</Link>
    </div>
  );
}