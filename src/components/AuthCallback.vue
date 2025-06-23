<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // Haal query parameters op uit de URL
  const urlParams = new URLSearchParams(window.location.search)
  const success = urlParams.get('success')
  const token = urlParams.get('token')
  const userEncoded = urlParams.get('user')
  const error = urlParams.get('error')

  if (success === 'true' && token && userEncoded) {
    try {
      // Decodeer user data
      const userData = JSON.parse(atob(userEncoded))
      
      // Sla token en user data op in de auth store
      authStore.setToken(token)
      authStore.setUser(userData)
      
      // Redirect naar home pagina
      router.push('/')
    } catch (err) {
      console.error('Fout bij verwerken van Google login data:', err)
      authStore.setError('Er is een fout opgetreden bij het verwerken van de login gegevens')
      router.push('/login')
    }
  } else if (error) {
    // Toon error en redirect naar login
    authStore.setError(error)
    router.push('/login')
  } else {
    // Geen geldige parameters, redirect naar login
    router.push('/login')
  }
})
</script>

<template>
  <div class="auth-callback">
    <div class="loading">
      <h2>Bezig met inloggen...</h2>
      <p>Een moment geduld, we verwerken je Google login.</p>
      <div class="spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.loading h2 {
  color: #2d3748;
  margin: 0 0 10px 0;
  font-size: 1.5em;
  font-weight: 600;
}

.loading p {
  color: #6b7280;
  margin: 0 0 20px 0;
  font-size: 0.95em;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 