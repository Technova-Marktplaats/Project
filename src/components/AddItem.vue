<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import apiService from '../services/api.js'

const router = useRouter()

// Form data
const formData = ref({
  title: '',
  description: '',
  category: '',
  available: true
})

// Image handling
const selectedImages = ref([])
const imagePreviewUrls = ref([])
const maxImages = 5
const maxFileSize = 5 * 1024 * 1024 // 5MB per bestand
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

//User permission pop up
function NotificationTest() {

}


//Camera Handling
const videoRef = ref(null)
const capturedImage = ref(null)

const initializeCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (err) {
    console.error('Error accessing camera:', err)
  }
}
const takePicture = () => {
  const video = videoRef.value
  if (!video) return

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const dataUrl = canvas.toDataURL('image/png')
  const base64Str = dataUrl.split(',')[1]

  // Converteer base64 naar Blob
  const byteString = atob(base64Str)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const intArray = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i)
  }

  const blob = new Blob([intArray], { type: 'image/png' })
  const filename = `camera-photo-${Date.now()}.png`
  const file = new File([blob], filename, { type: 'image/png' })

  // Voeg direct aan selectedImages toe
  selectedImages.value.push(file)

  // Optioneel: ook een preview
  imagePreviewUrls.value.push({ id: Date.now() + Math.random(), url: dataUrl, base64: base64Str })
}

// Form validation
const formErrors = ref({
  title: '',
  description: '',
  category: '',
  images: ''
})

// State
const categories = ref([])
const loading = ref(false)
const loadingCategories = ref(false)
const error = ref(null)

// Methods
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const response = await apiService.categories.getAll()
    console.log('Categories response:', response.data) // Debug log
    
    // Check if response has wrapper structure (success, data, message)
    if (response.data.data && Array.isArray(response.data.data)) {
      categories.value = response.data.data
    } else if (Array.isArray(response.data)) {
      categories.value = response.data
    } else {
      console.error('Unexpected response structure:', response.data)
      categories.value = []
    }
    
    console.log('Categories loaded:', categories.value) // Debug log
  } catch (err) {
    console.error('Fout bij ophalen categorieën:', err)
    error.value = 'Kon categorieën niet laden'
  } finally {
    loadingCategories.value = false
  }
}

const validateForm = () => {
  formErrors.value = { title: '', description: '', category: '', images: '' }
  let isValid = true

  // Titel validatie
  if (!formData.value.title.trim()) {
    formErrors.value.title = 'Titel is verplicht'
    isValid = false
  } else if (formData.value.title.length > 255) {
    formErrors.value.title = 'Titel mag maximaal 255 karakters bevatten'
    isValid = false
  }

  // Beschrijving validatie
  if (!formData.value.description.trim()) {
    formErrors.value.description = 'Beschrijving is verplicht'
    isValid = false
  }

  // Categorie validatie
  if (!formData.value.category) {
    formErrors.value.category = 'Selecteer een categorie'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = null

  try {
    // Maak FormData voor file upload
    const formDataToSend = new FormData()
    
    // Voeg tekst velden toe
    formDataToSend.append('title', formData.value.title.trim())
    formDataToSend.append('description', formData.value.description.trim())
    formDataToSend.append('category_id', formData.value.category)
    formDataToSend.append('available', formData.value.available ? '1' : '0')
    
    // Debug logging
    console.log('Aantal geselecteerde afbeeldingen:', selectedImages.value.length)
    console.log('Geselecteerde afbeeldingen:', selectedImages.value)
    
    // Voeg afbeeldingen toe - alleen als er daadwerkelijk bestanden zijn
    if (capturedImage.value) {
      fetch(capturedImage.value).then(res => res.blob()).then(blob => {
        const filename = `camera-photo-${Date.now()}.png`;
        const file = new File([blob], filename, { type: 'image/png' });
        selectedImages.value.push(file);
      }).catch(err => {
        console.error('Fout bij converteren van camerabeeld naar File:', err);
      });
    }

    if (selectedImages.value.length > 0) {
      selectedImages.value.forEach((file, index) => {
        console.log(`Afbeelding ${index}:`, file.name, file.type, file.size);
        if (file instanceof File) {
          formDataToSend.append('images[]', file);
          console.log(`File ${index} toegevoegd aan FormData`);
        } else {
          console.error(`Item ${index} is geen File object:`, typeof file, file);
        }
      });
    } else {
      console.log('Geen afbeeldingen geselecteerd');
    }

    // Debug FormData inhoud
    console.log('FormData entries:')
    let hasFiles = false
    for (let pair of formDataToSend.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0], 'File:', pair[1].name, pair[1].size, 'bytes', pair[1].type)
        hasFiles = true
      } else {
        console.log(pair[0], pair[1])
      }
    }
    
    console.log('FormData bevat bestanden:', hasFiles)
    console.log('Totaal FormData entries:', Array.from(formDataToSend.entries()).length)

    const response = await apiService.items.createWithImages(formDataToSend)
    
    console.log('Item aangemaakt:', response.data)
    
    // Redirect naar item detail pagina of items lijst
    router.push('/')
    
  } catch (err) {
    console.error('Fout bij aanmaken item:', err)
    console.error('Response data:', err.response?.data)
    console.error('Response status:', err.response?.status)
    
    if (err.response?.status === 422) {
      // Laravel validatie fouten
      const errors = err.response.data.errors
      console.error('Validatie fouten:', errors)
      
      if (errors) {
        Object.keys(errors).forEach(field => {
          if (formErrors.value.hasOwnProperty(field)) {
            formErrors.value[field] = errors[field][0]
          } else {
            // Log onbekende velden
            console.error(`Onbekend validatie veld: ${field}`, errors[field])
          }
        })
        
        // Speciale handling voor afbeelding fouten
        if (errors['images.0'] || errors['images'] || Object.keys(errors).some(key => key.includes('images'))) {
          formErrors.value.images = Object.keys(errors)
            .filter(key => key.includes('images'))
            .map(key => errors[key][0])
            .join(', ')
        }
      } else {
        error.value = 'De ingevoerde gegevens zijn ongeldig.'
      }
    } else {
      error.value = err.response?.data?.message || 'Er is een fout opgetreden bij het aanmaken van het item.'
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const clearError = () => {
  error.value = null
}

// Image handling functions
const validateImageFile = (file) => {
  if (!allowedTypes.includes(file.type)) {
    return 'Alleen JPEG, PNG en WebP bestanden zijn toegestaan'
  }
  
  if (file.size > maxFileSize) {
    return 'Bestand is te groot (max 5MB)'
  }
  
  return null
}

const handleImageSelect = (event) => {
  const files = Array.from(event.target.files)
  addImages(files)
}

const addImages = (files) => {
  formErrors.value.images = ''
  
  // Check maximum aantal afbeeldingen
  if (selectedImages.value.length + files.length > maxImages) {
    formErrors.value.images = `Maximaal ${maxImages} afbeeldingen toegestaan`
    return
  }
  
  files.forEach(file => {
    // Valideer bestand
    const validationError = validateImageFile(file)
    if (validationError) {
      formErrors.value.images = validationError
      return
    }
    
    // Voeg toe aan geselecteerde afbeeldingen
    selectedImages.value.push(file)
    
    // Maak preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImages.value.push(e.target.result.split(',')[1])
      imagePreviewUrls.value.push({
        id: Date.now() + Math.random(),
        url: e.target.result,
        base64: e.target.result.split(',')[1]
      })
    }


    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  selectedImages.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
  formErrors.value.images = ''
}

// Drag & Drop handlers
const isDragging = ref(false)

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = Array.from(event.dataTransfer.files)
  addImages(files)
}

onMounted(() => {

  fetchCategories()
  initializeCamera()

})
</script>

<template>
  <div class="add-item-container">
    <div class="add-item-header">
      <button @click="goBack" class="back-btn">
        ← Terug naar overzicht
      </button>
      <h1>Nieuw Item Toevoegen</h1>
    </div>

    <div class="add-item-card">
      <form @submit.prevent="handleSubmit" class="add-item-form">
        
        <div class="form-group">
          <label for="title">Titel *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="Geef je item een titel"
            :class="{ 'error': formErrors.title }"
            @input="clearError"
          />
          <span v-if="formErrors.title" class="error-message">{{ formErrors.title }}</span>
        </div>

        <div class="form-group">
          <label for="description">Beschrijving *</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Beschrijf je item in detail"
            rows="4"
            :class="{ 'error': formErrors.description }"
            @input="clearError"
          ></textarea>
          <span v-if="formErrors.description" class="error-message">{{ formErrors.description }}</span>
        </div>

        <div class="form-group">
          <label for="category">Categorie *</label>
          <select
            id="category"
            v-model="formData.category"
            :class="{ 'error': formErrors.category }"
            @change="clearError"
            :disabled="loadingCategories"
          >
            <option value="">
              {{ loadingCategories ? 'Categorieën laden...' : 'Selecteer een categorie' }}
            </option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <span v-if="formErrors.category" class="error-message">{{ formErrors.category }}</span>
        </div>

        <div class="form-group">
          <label>Afbeeldingen (optioneel)</label>

          <div v-if="capturedImage">
            <h3>Captured Photo:</h3>
            <img :src="capturedImage" alt="Captured Image" />
          </div>

          <div class="camera-preview">
            <video ref="videoRef" autoplay playsinline></video>
            <button type="button" @click="takePicture">{{ 'Maak heir en photo van de product die je wilt plaatsen' }}</button>
          </div>

          <div 
            class="image-upload-area"
            :class="{ 'dragging': isDragging, 'error': formErrors.images }"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <div class="upload-content">
              <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p>Sleep afbeeldingen hierheen of</p>
              <label for="image-input" class="upload-btn">
                Kies bestanden
              </label>
              <input
                id="image-input"
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleImageSelect"
                style="display: none;"
              />
              <p class="upload-info">Max {{ maxImages }} afbeeldingen, elk max 5MB (JPEG, PNG, WebP)</p>
            </div>
          </div>
          <span v-if="formErrors.images" class="error-message">{{ formErrors.images }}</span>
          
          <!-- Image previews -->
          <div v-if="imagePreviewUrls.length > 0" class="image-previews">
            <div 
              v-for="(preview, index) in imagePreviewUrls" 
              :key="preview.id" 
              class="image-preview"
            >
              <img :src="preview.url" :alt="`Preview ${index + 1}`" />
              <button 
                type="button" 
                @click="removeImage(index)" 
                class="remove-image-btn"
                title="Verwijder afbeelding"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.available"
              class="checkbox"
            />
            <span class="checkmark"></span>
            Item is beschikbaar
          </label>
        </div>

        <div v-if="error" class="server-error">
          <p>{{ error }}</p>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            @click="goBack" 
            class="cancel-btn"
            :disabled="loading"
          >
            Annuleren
          </button>
          <button 
            type="submit" 
            class="submit-btn"
            :disabled="loading || loadingCategories"
          >
            {{ loading ? 'Item wordt toegevoegd...' : 'Item Toevoegen' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.add-item-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.add-item-header {
  margin-bottom: 30px;
}

.back-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-bottom: 20px;
}

.back-btn:hover {
  background: #4b5563;
}

.add-item-header h1 {
  color: #2d3748;
  margin: 0;
  font-size: 2em;
  font-weight: 600;
}

.add-item-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95em;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error,
.form-group textarea.error,
.form-group select.error {
  border-color: #ef4444;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group select {
  cursor: pointer;
}

.form-group select:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-top: 5px;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  color: #ef4444;
  font-size: 0.85em;
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

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #4b5563;
}

.submit-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.cancel-btn:disabled,
.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .add-item-container {
    padding: 15px;
  }
  
  .add-item-card {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .add-item-header h1 {
    font-size: 1.7em;
  }
  
  .image-upload-area {
    padding: 30px 15px;
  }
  
  .upload-icon {
    width: 40px;
    height: 40px;
  }
  
  .image-previews {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    padding: 10px;
  }
  
  .upload-content p {
    font-size: 0.9em;
  }
  
  .upload-info {
    font-size: 0.8em !important;
  }
}

/* Image Upload Styles */
.image-upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-upload-area:hover {
  border-color: #4f46e5;
  background: #f8faff;
}

.image-upload-area.dragging {
  border-color: #4f46e5;
  background: #f0f4ff;
  transform: scale(1.02);
}

.image-upload-area.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
}

.upload-content p {
  margin: 0;
  color: #4b5563;
  font-size: 1em;
}

.upload-btn {
  background: #4f46e5;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-block;
}

.upload-btn:hover {
  background: #4338ca;
}

.upload-info {
  font-size: 0.85em !important;
  color: #6b7280 !important;
  margin-top: 8px;
}

.image-previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.image-preview {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  aspect-ratio: 1;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.remove-image-btn:hover {
  background: rgba(239, 68, 68, 1);
}
</style> 