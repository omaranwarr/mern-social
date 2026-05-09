import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const PostListContextMissing = Symbol('PostListContextMissing')

const PostListContext = createContext(PostListContextMissing)

/**
 * Mediator for post-list state: add/remove/replace rules live in one place so
 * screens stay thin (e.g. dedupe-by-id could be added here only).
 */
export function PostListProvider({ children }) {
  const [posts, setPostsState] = useState([])

  const setPosts = useCallback((next) => {
    setPostsState(Array.isArray(next) ? next : [])
  }, [])

  const addPost = useCallback((post) => {
    setPostsState((prev) => [post, ...prev])
  }, [])

  const removePost = useCallback((postId) => {
    setPostsState((prev) => prev.filter((p) => p._id !== postId))
  }, [])

  const value = useMemo(
    () => ({ posts, setPosts, addPost, removePost }),
    [posts, setPosts, addPost, removePost]
  )

  return (
    <PostListContext.Provider value={value}>
      {children}
    </PostListContext.Provider>
  )
}

export function usePostList() {
  const ctx = useContext(PostListContext)
  if (ctx === PostListContextMissing) {
    throw new Error('usePostList must be used within PostListProvider')
  }
  return ctx
}
