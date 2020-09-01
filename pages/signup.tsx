import React from "react";
import axios from 'axios';
import {makeStyles} from "@material-ui/core/styles";
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import config from "../config/config"

const useStyles = makeStyles(theme => ({
      container: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent:"center",
        maxWidth:400,
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
      }
}));

function SignUpForm() {
 const classes = useStyles();
 const [email, setEmail] = React.useState('');
 const [password, setPassword] = React.useState('');
 const [password2, setPassword2] = React.useState('');
 const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);
 const [helperText, setHelperText] = React.useState('');
 const [error, setError] = React.useState(false);
 function validateEmail(email:string) {
     const re = /\S+@\S+\.\S+/;
     return re.test(email);
 }
 React.useEffect(() => {
    if (email.trim() && password.trim() && password2.trim()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [email, password,password2]);

  const handleSignUp = (token:string) => {
    const login_data={email: email,password: password,'g-recaptcha-response': token}
    axios(`${config.domain}/signup`, {
      method: "post",
      data: login_data,
      withCredentials: true
    }).then((resp)=>{
      setError(false);
      setHelperText(resp.data.message);
      console.log(resp)
    }).catch((err)=>{
      console.log(err)
      setError(true);
      if(err.response){
        setHelperText(err.response.data.message)
        console.log(err.response)
      }else{
        setHelperText("Unknown error")
      }
    })
    
  };
  const _handleSignUp = () => {
    /*global grecaptcha*/ // defined in public/index.html
    if (validateEmail(email)) {
      if (password === password2) {
        if (password.length > 7 && password.length < 129) {
          grecaptcha.ready(function () {
            grecaptcha.execute(config.recaptcha_site_key, { action: 'signup' }).then(function (token) {
              handleSignUp(token)
            });
          })
        } else {
          setError(true)
          setHelperText("password length must be greater than  7 and less than 129")
        }
      } else {
        setError(true)
        setHelperText("passwords do not match")
      }
    } else {
      setError(true)
      setHelperText("email is invalid")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || _handleSignUp();
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
                onChange={(e)=>setPassword(e.target.value)}
                onKeyPress={(e)=>handleKeyPress(e)}
              />
              <TextField
                error={error}
                fullWidth
                id="password2"
                type="password"
                label="Repeat password"
                placeholder="Repeat password"
                margin="normal"
                helperText={helperText}
                onChange={(e)=>setPassword2(e.target.value)}
                onKeyPress={(e)=>handleKeyPress(e)}
              />
            </div>
          </CardContent>
          <CardActions  className={classes.CardActions}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              className={classes.loginBtn}
              onClick={()=>_handleSignUp()}
              disabled={isButtonDisabled}>
              SignUp
            </Button>
          </CardActions>
        </Card>
      </form>
  );
}

export default SignUpForm;