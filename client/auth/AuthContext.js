import React, { createContext, useContext, useEffect, useState } from 'react'
import auth, { AUTH_STATE_CHANGE_EVENT } from './auth-helper'

const AuthContextMissing = Symbol('AuthContextMissing')

const AuthContext = createContext(AuthContextMissing)

function readSession() {
  return auth.isAuthenticated()
}

/**
 * Holds the current JWT session (or false) and refreshes when sessionStorage changes
 * (Observer-style updates via auth-helper notifications).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())

  useEffect(() => {
    const sync = () => setSession(readSession())
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_STATE_CHANGE_EVENT, sync)
      return () => window.removeEventListener(AUTH_STATE_CHANGE_EVENT, sync)
    }
  }, [])

  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Same value shape as auth.isAuthenticated(): false, or { user, token } from session.
 */
export function useAuth() {
  const session = useContext(AuthContext)
  if (session === AuthContextMissing) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return session
}
