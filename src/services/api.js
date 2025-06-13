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
    
    getMyItems: () => 
      apiClient.get('/items/my-items'),
    
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
  },

  // Reservations endpoints
  reservations: {
    getAll: () => apiClient.get('/reservations'),
    getByItem: (itemId) => apiClient.get('/reservations', { params: { item_id: itemId } }),
    getMyItemReservations: (params) => apiClient.get('/reservations/my-items', { params }),
    create: (reservationData) => apiClient.post('/reservations', reservationData),
    approve: (id) => apiClient.post(`/reservations/${id}/approve`),
    reject: (id) => apiClient.post(`/reservations/${id}/reject`)
  },

  // Utility functions
  getCurrentApiUrl: () => API_CONFIG.BASE_URL,
  updateApiBaseUrl: (newUrl) => {
    API_CONFIG.BASE_URL = newUrl
    apiClient.defaults.baseURL = newUrl
    console.log(`API Base URL bijgewerkt naar: ${newUrl}`)
  }

}

// Handige helper voor direct gebruik
export default apiService 