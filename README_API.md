# API Configuratie Gids

## Overzicht

Alle API calls zijn nu gecentraliseerd in een modulair systeem. Je kunt de base URL en andere instellingen op één plek beheren.

## 📁 Bestandsstructuur

```
src/
├── config/
│   └── api.js          # Centrale configuratie
├── services/
│   └── api.js          # API service met alle endpoints
├── stores/
│   └── auth.js         # Auth store (gebruikt API service)
└── components/
    ├── Items.vue       # Items lijst (gebruikt API service)
    └── ItemDetail.vue  # Item details (gebruikt API service)
```

## ⚙️ Configuratie Wijzigen

### Methode 1: Direct in configuratie bestand

**Bestand: `src/config/api.js`**

```javascript
export const API_CONFIG = {
  // Verander deze URL naar jouw server
  BASE_URL: 'http://srv856957.hstgr.cloud/mp/api',
  
  // Of kies een environment:
  ENVIRONMENTS: {
    development: 'http://localhost:8000/api',
    staging: 'http://staging.marktplaats.com/api', 
    production: 'http://srv856957.hstgr.cloud/mp/api'
  }
}
```

### Methode 2: Programmatisch wijzigen

```javascript
import { updateApiBaseUrl } from './services/api'

// Wijzig de base URL tijdens runtime
updateApiBaseUrl('http://nieuwe-server.com/api')
```

### Methode 3: Environment switchen

```javascript
import { setEnvironment } from './config/api'

// Wissel naar development
setEnvironment('development')  // -> http://localhost:8000/api

// Wissel naar production  
setEnvironment('production')   // -> http://srv856957.hstgr.cloud/mp/api
```

## 🔧 Beschikbare API Endpoints

### Authentication
- `apiService.auth.login(credentials)`
- `apiService.auth.register(userData)`
- `apiService.auth.logout()`

### Items
- `apiService.items.getAll()`
- `apiService.items.getById(id)`
- `apiService.items.create(itemData)`
- `apiService.items.update(id, itemData)`
- `apiService.items.delete(id)`

## 🚀 Gebruik in Components

**Voorbeeld:**

```javascript
import apiService from '../services/api'

// In je component:
const fetchData = async () => {
  try {
    const response = await apiService.items.getAll()
    items.value = response.data
  } catch (error) {
    console.error('API fout:', error)
  }
}
```

## ✨ Voordelen

✅ **Centrale configuratie** - Verander URL op één plek  
✅ **Automatische headers** - Authorization token wordt automatisch toegevoegd  
✅ **Error handling** - 401 errors leiden automatisch tot logout  
✅ **Type safety** - Duidelijke API structuur  
✅ **Environment support** - Makkelijk wisselen tussen dev/staging/prod  
✅ **Herbruikbaar** - Gebruik dezelfde service in alle components  

## 🛠️ Nieuwe Endpoints Toevoegen

```javascript
// In src/services/api.js
export const apiService = {
  // ... bestaande endpoints ...
  
  // Nieuwe sectie toevoegen:
  categories: {
    getAll: () => apiClient.get('/categories'),
    getById: (id) => apiClient.get(`/categories/${id}`),
    create: (data) => apiClient.post('/categories', data)
  }
}
```

## 🔍 Debugging

```javascript
import { getCurrentApiUrl } from './services/api'

console.log('Huidige API URL:', getCurrentApiUrl())
``` 