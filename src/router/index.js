import { createRouter, createWebHistory } from "vue-router";
import AddPlant from '../views/AddPlant.vue';
import Home from '../views/Home.vue';
import SetupPlant from "../views/SetupPlant.vue";

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
  {
    path: "/setupplant",
    component: SetupPlant,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
