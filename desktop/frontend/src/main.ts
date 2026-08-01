import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import Dashboard from './views/Dashboard.vue';
import Nodes from './views/Nodes.vue';
import Devices from './views/Devices.vue';
import Settings from './views/Settings.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/nodes', name: 'nodes', component: Nodes },
    { path: '/devices', name: 'devices', component: Devices },
    { path: '/settings', name: 'settings', component: Settings },
  ],
});

createApp(App).use(router).mount('#app');
