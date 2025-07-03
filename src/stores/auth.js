import { defineStore } from 'pinia'
import apiService from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    userName: (state) => state.user?.name || '',
    userEmail: (state) => state.user?.email || ''
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.auth.login(credentials)
        const { user, access_token } = response.data

        // Token en user data opslaan
        this.token = access_token
        this.user = user
        this.isAuthenticated = true

        // Token in localStorage opslaan
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(user))

        return {
          success: true,
          message: response.data.message || 'Succesvol ingelogd'
        }

      } catch (error) {
        console.error('Login fout:', error)
        
        this.token = null
        this.user = null
        this.isAuthenticated = false

        if (error.response?.status === 422) {
          this.error = 'De ingevoerde gegevens zijn onjuist.'
        } else if (error.response?.status === 429) {
          this.error = 'Te veel login pogingen. Probeer het later opnieuw.'
        } else if (error.code === 'ECONNABORTED') {
          this.error = 'Verbinding time-out. Controleer je internetverbinding.'
        } else {
          this.error = error.response?.data?.message || 'Er is een fout opgetreden bij het inloggen.'
        }

        return {
          success: false,
          message: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.auth.register(userData)
        const { user, access_token } = response.data

        // Automatisch inloggen na registratie
        this.token = access_token
        this.user = user
        this.isAuthenticated = true

        // Token in localStorage opslaan
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('user_data', JSON.stringify(user))

        return {
          success: true,
          message: response.data.message || 'Account succesvol aangemaakt'
        }

      } catch (error) {
        console.error('Registratie fout:', error)
        
        this.token = null
        this.user = null
        this.isAuthenticated = false

        if (error.response?.status === 422) {
          // Laravel validatie fouten
          const errors = error.response.data.errors
          if (errors) {
            const errorMessages = Object.values(errors).flat()
            this.error = errorMessages.join(' ')
          } else {
            this.error = 'De ingevoerde gegevens zijn ongeldig.'
          }
        } else if (error.response?.status === 429) {
          this.error = 'Te veel registratie pogingen. Probeer het later opnieuw.'
        } else if (error.code === 'ECONNABORTED') {
          this.error = 'Verbinding time-out. Controleer je internetverbinding.'
        } else {
          this.error = error.response?.data?.message || 'Er is een fout opgetreden bij het registreren.'
        }

        return {
          success: false,
          message: this.error
        }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        // Server-side logout call via API service
        if (this.token) {
          await apiService.auth.logout()
        }
      } catch (error) {
        console.error('Logout API fout:', error)
        // Doorgaan met lokale logout ook al faalt de API call
      }

      // Lokale state opschonen
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.error = null

      // LocalStorage opschonen
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    },

    // Gebruiker data herstellen uit localStorage
    initializeAuth() {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')

      if (token && userData) {
        try {
          this.token = token
          this.user = JSON.parse(userData)
          this.isAuthenticated = true
        } catch (error) {
          console.error('Fout bij het herstellen van auth data:', error)
          this.logout() // Clear corrupted data
        }
      }
    },

    // Error state opschonen
    clearError() {
      this.error = null
    },

    // Handmatig token instellen (voor Google OAuth)
    setToken(token) {
      this.token = token
      localStorage.setItem('auth_token', token)
      // Zet isAuthenticated alleen op true als we ook user data hebben
      this.isAuthenticated = !!(this.token && this.user)
    },

    // Handmatig user data instellen (voor Google OAuth)
    setUser(userData) {
      this.user = userData
      localStorage.setItem('user_data', JSON.stringify(userData))
      // Zet isAuthenticated alleen op true als we ook token hebben
      this.isAuthenticated = !!(this.token && this.user)
    },

    // Handmatig error instellen
    setError(errorMessage) {
      this.error = errorMessage
    }
  }
}) 