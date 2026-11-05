// One sheet at a time (bottom sheet on phones, dialog on desktop). Forms mark themselves
// dirty; closing a dirty sheet — by ✕, scrim, Esc or swipe — asks before discarding.
import { reactive, markRaw, watch } from 'vue'

export const sheet = reactive({ open: false, component: null, props: {}, dirty: false, key: 0 })

export function openSheet(component, props = {}) {
  if (sheet.open && sheet.dirty && !confirm('Discard your changes?')) return
  Object.assign(sheet, { open: true, component: markRaw(component), props, dirty: false, key: sheet.key + 1 })
}

// Returns false when the user chose to keep editing.
export function closeSheet(force = false) {
  if (!force && sheet.dirty && !confirm('Discard your changes?')) return false
  sheet.open = false
  sheet.dirty = false
  return true
}

export const setDirty = (v = true) => { sheet.dirty = v }

// Call from a form's setup: any edit to `form` marks the sheet dirty.
export const trackDirty = (form) => watch(form, () => setDirty(true), { deep: true })

// Run a save/delete, then close without the discard prompt. Errors keep the sheet open.
export async function commit(fn, done) {
  try {
    await fn()
    closeSheet(true)
    done?.()
    return true
  } catch (e) {
    alert(e.message)
    return false
  }
}
