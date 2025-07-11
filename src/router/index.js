import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Items from '../components/Items.vue'
import ItemDetail from '../components/ItemDetail.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import AddItem from '../components/AddItem.vue'
import MyItems from '../components/MyItems.vue'
import MyReservations from '../components/MyReservations.vue'
import AuthCallback from '../components/AuthCallback.vue'
import Profile from '../components/Profile.vue'
import Notifications from '../components/Notifications.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // Alleen toegankelijk voor niet-ingelogde gebruikers
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true } // Alleen toegankelijk voor niet-ingelogde gebruikers
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback,
    meta: { requiresGuest: true } // Google OAuth callback
  },
  {
    path: '/api/auth/google/callback',
    name: 'AuthCallbackApi',
    component: AuthCallback,
    meta: { requiresGuest: true } // Google OAuth callback (backend route)
  },
  {
    path: '/',
    name: 'Items',
    component: Items,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/add-item',
    name: 'AddItem',
    component: AddItem,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/my-items',
    name: 'MyItems',
    component: MyItems,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/item/:id',
    name: 'ItemDetail',
    component: ItemDetail,
    props: true,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/my-reservations',
    name: 'MyReservations',
    component: MyReservations,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications,
    meta: { requiresAuth: true } // Vereist authenticatie
  },
  // Redirect route voor onbekende paden
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Route guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check of route authenticatie vereist
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect naar login als niet ingelogd
    next({ name: 'Login' })
    return
  }
  
  // Check of route alleen voor gasten is (zoals login pagina)
  if (to.meta.requiresGuest && authStore.isLoggedIn) {
    // Redirect naar home als al ingelogd
    next({ name: 'Items' })
    return
  }
  
  next()
})

export default router 