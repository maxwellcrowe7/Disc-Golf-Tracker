import { createApp, watch } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import LoginView from './views/LoginView.vue'
import ImportView from './views/ImportView.vue'
import HomeView from './views/HomeView.vue'
import ScheduleView from './views/ScheduleView.vue'
import EventView from './views/EventView.vue'
import ResultsView from './views/ResultsView.vue'
import CoursesView from './views/CoursesView.vue'
import CourseView from './views/CourseView.vue'
import SettingsView from './views/SettingsView.vue'
import { state } from './data/store.js'
import { restoreSession } from './data/session.js'
import { startTheme } from './lib/theme.js'
import './styles.css'

// Hash routing works on a GitHub Pages subpath without server config.
// meta.section lights up the nav item; meta.title shows in the compact top bar; meta.bare hides the app chrome.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { bare: true } },
    { path: '/import', component: ImportView, meta: { bare: true } },
    { path: '/', component: HomeView, meta: { section: 'home', title: 'Home' } },
    { path: '/schedule/:mode(list|cal|map)?', component: ScheduleView, meta: { section: 'schedule', title: 'Schedule' } },
    { path: '/event/:id', component: EventView, props: true, meta: { section: 'schedule', title: 'Event', back: true } },
    { path: '/results/:tab(events|rounds|leagues|stats)?', component: ResultsView, meta: { section: 'results', title: 'Results' } },
    { path: '/courses', component: CoursesView, meta: { section: 'courses', title: 'Course atlas' } },
    { path: '/course/:id', component: CourseView, props: true, meta: { section: 'courses', title: 'Course', back: true } },
    { path: '/settings', component: SettingsView, meta: { section: '', title: 'Settings', back: true } },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Nothing but the sign-in screen until data is loaded (signed in, or demo mode).
// A password-reset link keeps the sign-in screen up until the new password is saved.
router.beforeEach((to) => {
  if (state.recovery && to.path !== '/login') return '/login'
  if (!state.ready && to.path !== '/login') return '/login'
  if (state.ready && !state.recovery && to.path === '/login') return state.legacy ? '/import' : '/'
})

startTheme()
restoreSession()
  .catch((e) => console.error("Couldn't load your data", e))
  .finally(() => {
    createApp(App).use(router).mount('#app')
    if (state.ready && state.legacy) router.replace('/import')
    // The reset-link event can land after launch; show the new-password form when it does.
    watch(() => state.recovery, (on) => { if (on) router.replace('/login') })
  })
