import { ref } from 'vue'

const KEY = 'dg-theme'

function read() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' } catch (e) { return 'light' }
}

export const theme = ref(read())

export function setTheme(t) {
  theme.value = t
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0E1411' : '#F2EDE1')
  try { localStorage.setItem(KEY, t) } catch (e) {}
}

export const startTheme = () => setTheme(theme.value)
