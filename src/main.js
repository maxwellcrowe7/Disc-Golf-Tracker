import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import ScheduleView from './views/ScheduleView.vue'
import EventView from './views/EventView.vue'
import ResultsView from './views/ResultsView.vue'
import CoursesView from './views/CoursesView.vue'
import CourseView from './views/CourseView.vue'
import SettingsView from './views/SettingsView.vue'
import { loadDemo } from './data/store.js'
import { startTheme } from './lib/theme.js'
import './styles.css'

// Hash routing works on a GitHub Pages subpath without server config.
// meta.section lights up the nav item; meta.title shows in the compact top bar.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
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

startTheme()
loadDemo() // Supabase sign-in replaces this in the auth step.
createApp(App).use(router).mount('#app')
