import { api } from './api'

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })
      
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
          error: response.data.error || 'Login failed'
        }
      }
    } catch (error) {
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
