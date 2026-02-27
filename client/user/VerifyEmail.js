import React, { useState } from 'react'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Icon from '@material-ui/core/Icon'
import { makeStyles } from '@material-ui/core/styles'
import { verifyEmail } from './api-user.js'
import { Link, useHistory, useLocation } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: 600,
    margin: 'auto',
    textAlign: 'center',
    marginTop: theme.spacing(5),
    paddingBottom: theme.spacing(2)
  },
  error: {
    verticalAlign: 'middle'
  },
  title: {
    marginTop: theme.spacing(2),
    color: theme.palette.openTitle
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 300
  },
  submit: {
    margin: 'auto',
    marginBottom: theme.spacing(2)
  }
}))

export default function VerifyEmail() {
  const classes = useStyles()
  const history = useHistory()
  const location = useLocation()
  const verificationToken = location.state?.verificationToken

  const [values, setValues] = useState({
    code: '',
    error: ''
  })

  const handleChange = name => event => {
    setValues({ ...values, [name]: event.target.value })
  }

  const clickSubmit = () => {
    if (!verificationToken) {
      setValues({ ...values, error: 'Session expired. Please sign up again.' })
      return
    }
    verifyEmail(verificationToken, values.code).then((data) => {
      if (data.error) {
        setValues({ ...values, error: data.error })
      } else {
        history.push('/signin', { message: data.message })
      }
    })
  }

  if (!verificationToken) {
    return (
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" className={classes.title}>
            Verify your email
          </Typography>
          <Typography color="error" style={{ marginTop: 16 }}>
            No verification session found. Please <Link to="/signup">sign up again</Link>.
          </Typography>
        </CardContent>
        <CardActions>
          <Link to="/signup">
            <Button color="primary" variant="contained">Sign up</Button>
          </Link>
        </CardActions>
      </Card>
    )
  }

  return (
    <div>
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" className={classes.title}>
            Check your email
          </Typography>
          <Typography variant="body2" style={{ marginTop: 8, marginBottom: 16 }}>
            We sent a 6-digit code to your email. Enter it below.
          </Typography>
          <TextField
            id="code"
            label="Verification code"
            className={classes.textField}
            value={values.code}
            onChange={handleChange('code')}
            margin="normal"
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />
          <br />
          {values.error && (
            <Typography component="p" color="error">
              <Icon color="error" className={classes.error}>error</Icon>
              {values.error}
            </Typography>
          )}
        </CardContent>
        <CardActions>
          <Button color="primary" variant="contained" onClick={clickSubmit} className={classes.submit}>
            Verify &amp; complete sign up
          </Button>
        </CardActions>
      </Card>
      <Typography style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to="/signup">Back to sign up</Link>
      </Typography>
    </div>
  )
}
