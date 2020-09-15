import React from "react";
import axios from 'axios';
import { makeStyles } from "@material-ui/core/styles";
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import config from "../config/config"

import { useRouter } from 'next/router'
const useStyles = makeStyles(theme => ({
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
  }
}));

function ChangePassword() {
  const router = useRouter()
  const token = router.query.token
  const classes = useStyles();
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');
  const [isButtonDisabled, setIsButtonDisabled] = React.useState(true);
  const [helperText, setHelperText] = React.useState('');
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (password.trim() && password2.trim()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [password, password2]);


  const handleChangePassword = (captcha_token: string) => {
    const data = { token: token, password: password, 'g-recaptcha-response': captcha_token }
    axios(`/change_pw`, {
      method: "post",
      data: data,
      withCredentials: true
    }).then((resp) => {
      setError(false);
      setHelperText(resp.data.message);
      router.push("/login");
      console.log(resp)
    }).catch((err) => {
      setError(true);
      if (err.response) {
        setHelperText(err.response.data.message)
        console.log(err.response)
      } else {
        setHelperText("Unknown error")
      }
    })
  };
  const _handleChangePassword = () => {
    /*global grecaptcha*/ // defined in public/index.html
    if (password === password2) {
      grecaptcha.ready(function () {
        grecaptcha.execute(config.recaptcha_site_key, { action: 'login' }).then(function (token) {
          handleChangePassword(token)
        });
      })
    } else {
      setError(true)
      setHelperText("passwords do not match")
    }

  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || _handleChangePassword();
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
              id="password"
              type="password"
              label="Password"
              placeholder="Password"
              margin="normal"
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e)}
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
              onChange={(e) => setPassword2(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e)}
            />
          </div>
        </CardContent>
        <CardActions className={classes.CardActions}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            className={classes.loginBtn}
            onClick={() => _handleChangePassword()}
            disabled={isButtonDisabled}>
            Change password
            </Button>

        </CardActions>
      </Card>
    </form>
  );
}

export default ChangePassword;
