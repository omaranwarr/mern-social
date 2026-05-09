import React, {useState, useEffect} from 'react'
import {makeStyles} from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import { useAuth } from './../auth/AuthContext'
import PostList from './PostList'
import {listNewsFeed} from './api-post.js'
import NewPost from './NewPost'
import { PostListProvider, usePostList } from './PostListContext'

const useStyles = makeStyles(theme => ({
  card: {
    margin: 'auto',
    paddingTop: 0,
    paddingBottom: theme.spacing(3)
  },
  title: {
    padding:`${theme.spacing(3)}px ${theme.spacing(2.5)}px ${theme.spacing(2)}px`,
    color: theme.palette.openTitle,
    fontSize: '1em'
  },
  media: {
    minHeight: 330
  }
}))

function NewsfeedWithList () {
  const classes = useStyles()
  const { posts, setPosts, addPost, removePost } = usePostList()
  const jwt = useAuth()

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    listNewsFeed({
      userId: jwt.user._id
    }, {
      t: jwt.token
    }, signal).then((data) => {
      if (data.error) {
        console.log(data.error)
      } else {
        setPosts(data)
      }
    })
    return function cleanup(){
      abortController.abort()
    }

  }, [])

  return (
    <Card className={classes.card}>
      <Typography type="title" className={classes.title}>
        Newsfeed
      </Typography>
      <Divider/>
      <NewPost addUpdate={addPost}/>
      <Divider/>
      <PostList removeUpdate={(post) => removePost(post._id)} posts={posts}/>
    </Card>
  )
}

export default function Newsfeed () {
  return (
    <PostListProvider>
      <NewsfeedWithList />
    </PostListProvider>
  )
}
