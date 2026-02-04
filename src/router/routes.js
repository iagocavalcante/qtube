
const routes = [
  {
    path: '/',
    redirect: '/index',
    component: () => import('layouts/default.vue'),
    children: [
      { path: 'index', component: () => import('pages/index.vue') },
      { path: 'videos', component: () => import('pages/videos.vue') },
      { path: 'musics', component: () => import('pages/musics.vue') },
      { path: 'player', name: 'player', component: () => import('pages/player.vue') }
    ]
  },
  { // Always leave this as last one
    path: '/:catchAll(.*)*',
    component: () => import('pages/404.vue')
  }
]

export default routes
