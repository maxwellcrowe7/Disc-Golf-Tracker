<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './components/Icon.vue'
import { state } from './data/store.js'
import { topo } from './lib/plate.js'
import { toastState } from './lib/toast.js'
import SheetHost from './components/SheetHost.vue'
import QuickSheet from './components/sheets/QuickSheet.vue'
import { openSheet } from './lib/sheet.js'

const NAV = [
  { key: 'home', label: 'Home', icon: 'home', to: '/' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar', to: '/schedule' },
  { key: 'results', label: 'Results', icon: 'trophy', to: '/results' },
  { key: 'courses', label: 'Courses', icon: 'course', to: '/courses' },
]

const route = useRoute()
const section = computed(() => route.meta.section || 'home')
const sidebarTopo = topo('sidebar', 'rgba(242,237,225,.13)', 16)
const initials = computed(() => state.profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2) || 'DG')
const latestRating = computed(() => [...state.ratings].sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0]?.rating)

// ── sliding indicators under the active nav item ──
const tabbar = ref(null), sidebarNav = ref(null)
const tabInd = ref({ opacity: 0 }), sideInd = ref({})
function placeIndicators() {
  const on = tabbar.value?.querySelector('a.on')
  tabInd.value = on ? { opacity: 1, width: on.offsetWidth - 8 + 'px', transform: `translateX(${on.offsetLeft + 4}px)` } : { opacity: 0 }
  const son = sidebarNav.value?.querySelector('a.on')
  sideInd.value = son ? { transform: `translateY(${son.offsetTop}px)` } : { opacity: 0 }
}

// ── compact top bar slides in once the page's big title scrolls away ──
const topbarShow = ref(false)
let io = null
function watchSentinel() {
  io?.disconnect()
  topbarShow.value = false
  const el = document.querySelector('[data-sentinel]')
  if (!el) return
  io = new IntersectionObserver(([en]) => { topbarShow.value = !en.isIntersecting && en.boundingClientRect.top < 60 }, { rootMargin: '-56px 0px 0px 0px' })
  io.observe(el)
}

watch(() => route.fullPath, () => nextTick(() => { placeIndicators(); watchSentinel() }))
onMounted(() => { nextTick(() => { placeIndicators(); watchSentinel() }); addEventListener('resize', placeIndicators) })
onBeforeUnmount(() => { io?.disconnect(); removeEventListener('resize', placeIndicators) })

const logSomething = () => openSheet(QuickSheet)
</script>

<template>
  <main v-if="route.meta.bare" class="main bare"><RouterView /></main>
  <template v-else>
  <div class="app">
    <aside class="sidebar">
      <div v-html="sidebarTopo" style="display: contents" />
      <div class="brand">
        <svg width="36" height="36" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="var(--disc)" /><circle cx="17" cy="17" r="11" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" /><circle cx="17" cy="17" r="4" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1" /><path d="M6.5 21c5-6.5 13-9 21.5-7.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray=".5 3.4" /></svg>
        <div><b>Fairway</b><small>Disc golf log</small></div>
      </div>
      <div ref="sidebarNav" class="nav-wrap">
        <span class="side-ind" :style="sideInd"></span>
        <RouterLink v-for="(n, i) in NAV" :key="n.key" :to="n.to" class="nav" :class="{ on: section === n.key }">
          <Icon :name="n.icon" />{{ n.label }}<span class="k">{{ String(i + 1).padStart(2, '0') }}</span>
        </RouterLink>
      </div>
      <button class="add" @click="logSomething"><Icon name="plus" size="sm" />Log something</button>
      <RouterLink to="/settings" class="me">
        <div class="av">{{ initials }}</div>
        <div><b>{{ state.profile.name || 'Player' }}</b><small v-if="state.profile.pdga_number">PDGA #{{ state.profile.pdga_number }}</small></div>
        <div class="rt">{{ latestRating || '' }}</div>
      </RouterLink>
    </aside>

    <main class="main">
      <RouterView />
    </main>
  </div>

  <header class="topbar" :class="{ show: topbarShow }">
    <div class="slot">
      <a v-if="route.meta.back" class="icon-btn" style="width: 34px; height: 34px" @click="$router.back()"><Icon name="chevL" size="sm" /></a>
    </div>
    <div class="tb-title">{{ route.meta.title }}</div>
    <div class="slot"></div>
  </header>

  <nav ref="tabbar" class="tabbar">
    <span class="tab-ind" :style="tabInd"></span>
    <RouterLink v-for="n in NAV.slice(0, 2)" :key="n.key" :to="n.to" :class="{ on: section === n.key }"><Icon :name="n.icon" />{{ n.label }}</RouterLink>
    <button class="fab" aria-label="Log something" @click="logSomething"><Icon name="plus" /></button>
    <RouterLink v-for="n in NAV.slice(2)" :key="n.key" :to="n.to" :class="{ on: section === n.key }"><Icon :name="n.icon" />{{ n.label }}</RouterLink>
  </nav>
  </template>

  <SheetHost />
  <div class="toast" :class="{ show: toastState.show }"><Icon name="check" size="sm" />{{ toastState.msg }}</div>
</template>
