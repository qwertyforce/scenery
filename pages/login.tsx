import React from "react";
import axios from 'axios';
import {makeStyles} from "@material-ui/core/styles";
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Link from '../components/Link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Grid from "@material-ui/core/Grid";
import SvgIcon from "@material-ui/core/SvgIcon";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { useRouter } from 'next/router'
import config from "../config/config"

const useStyles = makeStyles(theme => ({
      container: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent:"center",
        margin: `${theme.spacing(0)} auto`
      },
      loginBtn: {
        marginBottom: theme.spacing(2),
        flexGrow: 1
      },
      card: {
        marginTop: theme.spacing(10)
      },
      CardActions:{
        'flex-wrap': 'wrap'
      },
      Oauth:{
        'margin-left': '0px !important'
      }
}));

function LoginForm(props: { handleSync: ((event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void) | undefined; }) {
 const router = useRouter()
 const classes = useStyles();
 const [email, setEmail] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);
 const [helperText, setHelperText] = React.useState('');
 const [error, setError] = React.useState(false);

 React.useEffect(() => {
    if (email.trim() && password.trim()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [email, password]);
  

  const handleLogin = (token:string) => {
    const login_data={email: email,password: password,'g-recaptcha-response': token}
    axios(`/login`, {
      method: "post",
      data: login_data,
      withCredentials: true
    }).then((resp)=>{
      setError(false);
      setHelperText('Successful');
      router.push("/");
      console.log(resp)
    }).catch((err)=>{
      setError(true);
      if(err.response){
        setHelperText(err.response.data.message)
        console.log(err.response)
      }else{
        setHelperText("Unknown error")
      }
    })
  };
  const _handleLogin = () => {
    /*global grecaptcha*/ // defined in public/index.html
    grecaptcha.ready(function() {
      grecaptcha.execute(config.recaptcha_site_key, {action: 'login'}).then(function(token) {
        handleLogin(token)
      });
      })
}

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || _handleLogin();
    }
  };
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
                onChange={(e)=>setEmail(e.target.value)}
                onKeyPress={(e)=>handleKeyPress(e)}
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
                onChange={(e)=>setPassword(e.target.value)}
                onKeyPress={(e)=>handleKeyPress(e)}
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
          <CardActions  className={classes.CardActions}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              className={classes.loginBtn}
              onClick={()=>_handleLogin()}
              disabled={isButtonDisabled}>
              Login
            </Button>

            <Grid
              className={classes.Oauth}
              container
              direction="row"
              justify="center"
              spacing={1}
              alignItems="center"
            >
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={props.handleSync}
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
                  onClick={props.handleSync}
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

export default LoginForm;
