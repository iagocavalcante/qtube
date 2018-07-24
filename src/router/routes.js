
export default [
  {
    path: '/',
    redirect: '/index',
    component: () => import('layouts/default'),
    children: [
      { path: 'index', component: () => import('pages/index') },
      { path: 'videos', component: () => import('pages/videos') },
      { path: 'musics', component: () => import('pages/musics') },
      { path: 'player/:src/:img', name: 'player', component: () => import('pages/player') }
    ]
  },
  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
