import axios from 'axios'
import { API_CONFIG } from '../config/api'

// Axios instance maken met configuratie
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS
})

// Request interceptor voor automatische Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Voor FormData requests, laat browser de Content-Type automatisch instellen
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      
      // Temporary debugging voor FormData
      console.log('AXIOS: FormData request gedetecteerd')
      console.log('AXIOS: URL:', config.url)
      console.log('AXIOS: Method:', config.method)
      console.log('AXIOS: Headers:', config.headers)
      
      // Log FormData contents
      console.log('AXIOS: FormData entries:')
      for (let pair of config.data.entries()) {
        if (pair[1] instanceof File) {
          console.log('AXIOS:', pair[0], 'File:', pair[1].name, pair[1].size, 'bytes', pair[1].type)
        } else {
          console.log('AXIOS:', pair[0], pair[1])
        }
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor voor error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Als 401 (Unauthorized), token is verlopen - logout
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      // Alleen redirect als we niet al op login pagina zijn
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API Service object met alle endpoints
export const apiService = {
  // Authentication endpoints
  auth: {
    login: (credentials) => 
      apiClient.post('/login', credentials),
    
    register: (userData) => 
      apiClient.post('/register', userData),
    
    logout: () => 
      apiClient.post('/logout')
  },

  // Items endpoints
  items: {
    getAll: () => 
      apiClient.get('/items'),
    
    getById: (id) => 
      apiClient.get(`/items/${id}`),
    
    create: (itemData) => 
      apiClient.post('/items', itemData),
    
    createWithImages: (formData) => 
      apiClient.post('/items', formData),
    
    update: (id, itemData) => 
      apiClient.put(`/items/${id}`, itemData),
    
    delete: (id) => 
      apiClient.delete(`/items/${id}`)
  },

  // Categories endpoints
  categories: {
    getAll: () => 
      apiClient.get('/categories')
  }

  // Toekomstige endpoints kunnen hier worden toegevoegd:
  // users: {
  //   getProfile: () => apiClient.get('/user'),
  //   updateProfile: (data) => apiClient.put('/user', data)
  // }
}

// Helper functies voor configuratie
export const updateApiBaseUrl = (newUrl) => {
  API_CONFIG.BASE_URL = newUrl
  apiClient.defaults.baseURL = newUrl
  console.log(`API Base URL bijgewerkt naar: ${newUrl}`)
}

export const getCurrentApiUrl = () => API_CONFIG.BASE_URL

// Handige helper voor direct gebruik
export default apiService 