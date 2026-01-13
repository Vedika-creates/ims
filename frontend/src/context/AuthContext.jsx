import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = authService.getToken()
    if (token) {
      // Token exists, user is loaded from localStorage
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    setLoading(true)
    const result = await authService.login(credentials.email, credentials.password)
    if (result.success) {
      setUser(result.user)
    }
    setLoading(false)
    return result
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const contextValue = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: authService.isAuthenticated()
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
