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

  console.log('AuthCallback URL parameters:', { success, token, userEncoded, error })
  console.log('Full URL:', window.location.href)

  if (success === 'true' && token && userEncoded) {
    try {
      // Decodeer user data
      const userData = JSON.parse(atob(userEncoded))
      
      console.log('Google OAuth callback data:', { token, userData })
      
      // Sla token en user data op in de auth store
      authStore.setToken(token)
      authStore.setUser(userData)
      
      // Wacht even om zeker te zijn dat de auth store is bijgewerkt
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Controleer of de gebruiker nu ingelogd is
      if (authStore.isLoggedIn) {
        console.log('Gebruiker succesvol ingelogd via Google OAuth')
        // Kleine vertraging om zeker te zijn dat alles is verwerkt
        setTimeout(() => {
          router.push('/')
        }, 250)
      } else {
        console.error('Auth store niet correct bijgewerkt na Google OAuth')
        console.error('Auth store state:', {
          token: authStore.token,
          user: authStore.user,
          isLoggedIn: authStore.isLoggedIn,
          isAuthenticated: authStore.isAuthenticated
        })
        throw new Error('Auth store niet correct bijgewerkt')
      }
    } catch (err) {
      console.error('Fout bij verwerken van Google login data:', err)
      authStore.setError('Er is een fout opgetreden bij het verwerken van de login gegevens')
      router.push('/login')
    }
  } else if (success === 'false' && error) {
    // Specifieke error van de server
    console.error('Google OAuth server error:', error)
    authStore.setError(error)
    router.push('/login')
  } else if (error) {
    // Algemene error
    console.error('Google OAuth error:', error)
    authStore.setError(error)
    router.push('/login')
  } else {
    // Geen geldige parameters, redirect naar login
    console.error('Geen geldige OAuth parameters ontvangen')
    authStore.setError('Geen geldige login gegevens ontvangen van Google')
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