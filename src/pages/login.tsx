import axios from 'axios'
import { makeStyles } from 'tss-react/mui';
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Link from '../components/Link'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Grid from "@mui/material/Grid"
import SvgIcon from "@mui/material/SvgIcon"
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons"
import { useRouter } from 'next/router'
import { KeyboardEvent, useEffect, useState } from 'react'

const useStyles = makeStyles()((theme:any) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: "center",
    margin: `${theme.spacing(0)} auto`
  },
  loginBtn: {
    marginBottom: theme.spacing(2),
    flexGrow: 1
  },
  card: {
    marginTop: theme.spacing(10)
  },
  CardActions: {
    'flex-wrap': 'wrap'
  },
  Oauth: {
    'margin-left': '0px !important'
  }
}));

function LoginForm() {
  const router = useRouter()
  const { classes } = useStyles()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)
  const [helperText, setHelperText] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (email.trim() && password.trim()) {
      setIsButtonDisabled(false)
    } else {
      setIsButtonDisabled(true)
    }
  }, [email, password])


  const handleLogin = (token: string) => {
    const login_data = { email: email, password: password, 'g-recaptcha-response': token }
    axios(`/login`, {
      method: "post",
      data: login_data,
      withCredentials: true
    }).then((resp) => {
      setError(false)
      setHelperText('Successful')
      router.push("/")
      console.log(resp)
    }).catch((err) => {
      setError(true)
      if (err.response) {
        setHelperText(err.response.data.message)
        console.log(err.response)
      } else {
        setHelperText("Unknown error")
      }
    })
  }
  const _handleLogin = () => {
    /*global grecaptcha*/ // defined in pages/_document.tsx
    grecaptcha.ready(function () {
      grecaptcha.execute(process.env.recaptcha_site_key, { action: 'login' }).then(function (token) {
        handleLogin(token)
      })
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || _handleLogin()
    }
  }
  return (
    <form className={classes.container} noValidate autoComplete="off">
      <Card className={classes.card}>
        <CardContent>
          <div>
            <TextField
              error={error}
              fullWidth
              id="email"
              type="email"
              label="Email"
              placeholder="Email"
              margin="normal"
              onChange={(e:any) => setEmail(e.target.value)}
              onKeyPress={(e: KeyboardEvent<HTMLDivElement>) => handleKeyPress(e)}
            />
            <TextField
              error={error}
              fullWidth
              id="password"
              type="password"
              label="Password"
              placeholder="Password"
              margin="normal"
              helperText={helperText}
              onChange={(e:any) => setPassword(e.target.value)}
              onKeyPress={(e: KeyboardEvent<HTMLDivElement>) => handleKeyPress(e)}
            />
            <Box display="flex" justifyContent="flex-end">
              <Button color="primary" component={Link} href="/forgot_pw">
                Forgot password
             </Button>
              <Button color="primary" component={Link} href="/signup">
                Sign up
             </Button>
            </Box>

          </div>
        </CardContent>
        <CardActions className={classes.CardActions}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            className={classes.loginBtn}
            onClick={() => _handleLogin()}
            disabled={isButtonDisabled}>
            Login
            </Button>

          <Grid
            className={classes.Oauth}
            container
            direction="row"
            justifyContent="center"
            spacing={1}
            alignItems="center"
          >
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                href={`/auth/google`}
                startIcon={
                  <SvgIcon>
                    <FontAwesomeIcon icon={faGoogle} size="lg" />
                  </SvgIcon>
                }
              >
                Google
                </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                href={`/auth/github`}
                startIcon={
                  <SvgIcon>
                    <FontAwesomeIcon icon={faGithub} size="lg" />
                  </SvgIcon>
                }
              >
                Github
                </Button>
            </Grid>
          </Grid>
        </CardActions>
      </Card>
    </form>
  );
}

export default LoginForm
