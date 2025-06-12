// API Configuration
// Verander hier je API instellingen

export const API_CONFIG = {
  // Hoofdinstellingen - verander dit om naar een andere server te wijzen
  BASE_URL: 'http://localhost/LaravelBackend/public/api',
  
  // Algemene instellingen
  TIMEOUT: 10000, // 10 seconden
  
  // Standaard headers
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },

  // Environment specifieke configuraties
  ENVIRONMENTS: {
    development: 'http://localhost/LaravelBackend/public/api',
    staging: 'http://staging.marktplaats.com/api', 
    production: 'http://srv856957.hstgr.cloud/mp/api'
  }
}

// Helper om environment specifieke URL te krijgen
export const getApiUrl = (environment = 'production') => {
  return API_CONFIG.ENVIRONMENTS[environment] || API_CONFIG.BASE_URL
}

// Helper om snel van environment te wisselen
export const setEnvironment = (env) => {
  const url = getApiUrl(env)
  if (url) {
    API_CONFIG.BASE_URL = url
    return url
  }
  throw new Error(`Onbekende environment: ${env}`)
} 