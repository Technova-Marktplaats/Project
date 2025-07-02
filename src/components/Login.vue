<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getGoogleRedirectUrl } from '../config/api'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const formData = ref({
  email: '',
  password: ''
})

// Form validation
const formErrors = ref({
  email: '',
  password: ''
})

const isFormValid = ref(false)

// Methods
const validateForm = () => {
  formErrors.value = { email: '', password: '' }
  let isValid = true

  // Email validatie
  if (!formData.value.email) {
    formErrors.value.email = 'E-mail is verplicht'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(formData.value.email)) {
    formErrors.value.email = 'Ongeldig e-mail formaat'
    isValid = false
  }

  // Wachtwoord validatie
  if (!formData.value.password) {
    formErrors.value.password = 'Wachtwoord is verplicht'
    isValid = false
  } else if (formData.value.password.length < 6) {
    formErrors.value.password = 'Wachtwoord moet minimaal 6 karakters bevatten'
    isValid = false
  }

  isFormValid.value = isValid
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const result = await authStore.login(formData.value)

  if (result.success) {
    // Redirect naar items pagina
    router.push('/')
  }
  // Errors worden automatisch getoond via de store
}

const handleGoogleLogin = async () => {
  try {
    const googleRedirectEndpoint = getGoogleRedirectUrl()
    
    // Fetch the Google OAuth URL from the backend
    const response = await fetch(googleRedirectEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Redirect to the Google OAuth URL
    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error('Geen Google OAuth URL ontvangen van de server')
    }
  } catch (error) {
    console.error('Fout bij Google login:', error)
    authStore.setError('Er is een fout opgetreden bij Google login')
  }
}

const clearError = () => {
  authStore.clearError()
}

// Redirect als al ingelogd
onMounted(() => {
  if (authStore.isLoggedIn) {
    router.push('/')
  }
})
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Inloggen</h1>
        <p>Log in om je account te beheren</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email">E-mail adres</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="je@email.com"
            :class="{ 'error': formErrors.email }"
            @input="clearError"
          />
          <span v-if="formErrors.email" class="error-message">{{ formErrors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Wachtwoord</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="••••••••"
            :class="{ 'error': formErrors.password }"
            @input="clearError"
          />
          <span v-if="formErrors.password" class="error-message">{{ formErrors.password }}</span>
        </div>

        <div v-if="authStore.error" class="server-error">
          <p>{{ authStore.error }}</p>
        </div>

        <button 
          type="submit" 
          class="login-btn"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Bezig met inloggen...' : 'Inloggen' }}
        </button>

        <div class="divider">
          <span>of</span>
        </div>

        <button 
          type="button" 
          class="google-btn"
          @click="handleGoogleLogin"
        >
          <img src="../assets/google-icon.svg" alt="Google" class="google-icon" />
          Inloggen met Google
        </button>
      </form>

      <div class="login-footer">
        <p>Nog geen account? <a href="#" @click.prevent="$router.push('/register')">Registreer hier</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #2d3748;
  margin: 0 0 10px 0;
  font-size: 2em;
  font-weight: 600;
}

.login-header p {
  color: #6b7280;
  margin: 0;
  font-size: 0.95em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9em;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.8em;
  margin-top: 4px;
}

.server-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px;
  color: #b91c1c;
  font-size: 0.9em;
}

.login-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  margin-top: 10px;
}

.login-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.login-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.login-footer p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9em;
}

.login-footer a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 10px;
  color: #6b7280;
  font-size: 0.9em;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  width: 100%;
}

.google-btn:hover {
  background: #f9fafb;
  transform: translateY(-1px);
}

.google-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-header h1 {
    font-size: 1.7em;
  }
}
</style> 