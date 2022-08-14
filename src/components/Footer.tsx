import { makeStyles } from 'tss-react/mui';
import Link from './Link'
const useStyles = makeStyles()(() => ({
  footer: {
    display: "flex",
    justifyContent: "center"
  }
}));

export default function Footer() {
  const { classes } = useStyles()
  return (
    <div>
      <div className={classes.footer}>
        <Link prefetch={false} href={process.env.api_domain}>API&nbsp;</Link>
        <Link prefetch={false} href='/stats'>Stats&nbsp;</Link>
        <Link prefetch={false} href='/tags'>Tags&nbsp;</Link>
        <Link prefetch={false} href='/about'>About&nbsp;</Link>
      </div>
      <div className={classes.footer}>
        Powered by&nbsp;<Link href='https://github.com/qwertyforce/scenery'>scenery</Link>
      </div>
    </div>
  )
}