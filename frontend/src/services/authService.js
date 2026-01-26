import { api } from './api'

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('🔍 Attempting login with:', { email, password: '***' })
      const response = await api.post('/auth/login', {
        email,
        password
      })
      
      console.log('🔍 Login response:', response.data)
      console.log('🔍 Response has token:', !!response.data.token)
      console.log('🔍 Response has user:', !!response.data.user)
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        console.log('✅ Token saved to localStorage:', localStorage.getItem('token'))
        console.log('✅ User saved to localStorage:', localStorage.getItem('user'))
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        }
      } else {
        console.log('❌ No token in response')
        return {
          success: false,
          error: response.data.error || 'Login failed - no token received'
        }
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || 'Network error'
      }
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        }
      } else {
        return {
          success: false,
          error: response.data.error || 'Registration failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Network error'
      }
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    return !!token
  }
}
