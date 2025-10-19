import { createRouter, createWebHistory } from "vue-router";
import AddPlant from '../views/AddPlant.vue';
import Home from '../views/Home.vue';

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/addplant",
    component: AddPlant,
  },
  {
    path: "/home",
    component: Home,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
