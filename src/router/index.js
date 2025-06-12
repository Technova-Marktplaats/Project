import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Items from '../components/Items.vue'
import ItemDetail from '../components/ItemDetail.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import AddItem from '../components/AddItem.vue'
import MyItems from '../components/MyItems.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // Alleen toegankelijk voor niet-ingelogde gebruikers
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true } // Alleen toegankelijk voor niet-ingelogde gebruikers
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
    path: '/item/:id',
    name: 'ItemDetail',
    component: ItemDetail,
    props: true,
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