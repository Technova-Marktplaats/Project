import { createRouter, createWebHistory } from 'vue-router'
import Items from '../components/Items.vue'
import ItemDetail from '../components/ItemDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Items',
    component: Items
  },
  {
    path: '/item/:id',
    name: 'ItemDetail',
    component: ItemDetail,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 