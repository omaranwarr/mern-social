import React, {useState} from 'react'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Icon from '@material-ui/core/Icon'
import { makeStyles } from '@material-ui/core/styles'
import { create } from './api-user.js'
import { Link, useHistory } from 'react-router-dom'

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

export default function Signup() {
  const classes = useStyles()
  const history = useHistory()
  const [values, setValues] = useState({
    name: '',
    password: '',
    email: '',
    error: '',
    submitting: false
  })

  const handleChange = name => event => {
    setValues({ ...values, [name]: event.target.value })
  }

  const clickSubmit = () => {
    setValues({ ...values, error: '', submitting: true })
    const user = {
      name: values.name || undefined,
      email: values.email || undefined,
      password: values.password || undefined
    }
    create(user).then((data) => {
      setValues((prev) => ({ ...prev, submitting: false }))
      if (!data) {
        setValues((prev) => ({ ...prev, error: 'Something went wrong. Please try again.' }))
        return
      }
      if (data.error) {
        setValues((prev) => ({ ...prev, error: data.error }))
      } else if (data.verificationToken) {
        history.push('/signup/verify', { verificationToken: data.verificationToken })
      } else {
        setValues((prev) => ({ ...prev, error: 'Something went wrong. Please try again.' }))
      }
    }).catch(() => {
      setValues((prev) => ({ ...prev, submitting: false, error: 'Something went wrong. Please try again.' }))
    })
  }

  return (
    <div>
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" className={classes.title}>
            Sign Up
          </Typography>
          <TextField id="name" label="Name" className={classes.textField} value={values.name} onChange={handleChange('name')} margin="normal" /><br />
          <TextField id="email" type="email" label="Email" className={classes.textField} value={values.email} onChange={handleChange('email')} margin="normal" /><br />
          <TextField id="password" type="password" label="Password" className={classes.textField} value={values.password} onChange={handleChange('password')} margin="normal" />
          <br />
          {values.error && (
            <Typography component="p" color="error">
              <Icon color="error" className={classes.error}>error</Icon>
              {values.error}
            </Typography>
          )}
        </CardContent>
        <CardActions>
          <Button
            color="primary"
            variant="contained"
            onClick={clickSubmit}
            className={classes.submit}
            disabled={values.submitting}
          >
            {values.submitting ? 'Sending verification email…' : 'Submit'}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}