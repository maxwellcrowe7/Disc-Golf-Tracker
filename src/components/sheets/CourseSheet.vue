<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import SheetFrame from '../SheetFrame.vue'
import { courseById, state } from '../../data/store.js'
import { saveCourse, deleteCourse } from '../../data/mutate.js'
import { trackDirty, commit } from '../../lib/sheet.js'
import { plateSvg, TERRAINS } from '../../lib/plate.js'
import { toast } from '../../lib/toast.js'

const props = defineProps({ id: String })
const router = useRouter()
const existing = props.id ? courseById(props.id) : null
const form = reactive({ name: '', city: '', state: '', holes: 18, terrain: 'mixed', length_ft: '', notes: '', ...(existing || {}) })
trackDirty(form)

// Each terrain gets a little plate preview, drawn from this course's own seed.
const previews = computed(() => TERRAINS.map((t) => ({ t, svg: plateSvg({ id: props.id || 'new', name: form.name || 'New course', terrain: t }, { lite: true }) })))
const roundCount = computed(() => (props.id ? state.rounds.filter((r) => r.course_id === props.id).length : 0))

function save() {
  if (!form.name.trim()) return toast('Give the course a name')
  const holes = form.holes === '' ? null : +form.holes
  if (holes != null && !(holes >= 1 && holes <= 54)) return toast('Holes should be between 1 and 54')
  commit(async () => {
    const id = await saveCourse({ ...form, name: form.name.trim(), holes, length_ft: form.length_ft ? +form.length_ft : null })
    toast(existing ? 'Course updated' : 'Course added')
    if (!existing) router.push(`/course/${id}`)
  })
}

function remove() {
  const extra = roundCount.value ? ` Its ${roundCount.value} rounds stay, without a course.` : ''
  if (!confirm(`Delete ${existing.name}?${extra}`)) return
  commit(async () => { await deleteCourse(existing.id); toast('Course deleted'); router.replace('/courses') })
}
</script>

<template>
  <SheetFrame :title="existing ? 'Edit course' : 'New course'">
    <div class="field" style="margin-top: 0"><div class="lbl">Name</div><input v-model="form.name" class="input" placeholder="e.g. Hawk Island Park" /></div>
    <div class="field two">
      <div><div class="lbl">City</div><input v-model="form.city" class="input" placeholder="Lansing" /></div>
      <div><div class="lbl">State</div><input v-model="form.state" class="input" placeholder="MI" maxlength="20" /></div>
    </div>
    <div class="field two">
      <div><div class="lbl">Holes</div><input v-model="form.holes" class="input" inputmode="numeric" /></div>
      <div><div class="lbl">Length<span class="hint sug">Feet, optional</span></div><input v-model="form.length_ft" class="input" inputmode="numeric" placeholder="6,200" /></div>
    </div>
    <div class="field">
      <div class="lbl">Terrain<span class="hint sug">Sets the plate art</span></div>
      <div class="terrain-pick">
        <button v-for="p in previews" :key="p.t" type="button" :class="{ on: form.terrain === p.t }" @click="form.terrain = p.t">
          <span class="art" v-html="p.svg"></span><span>{{ p.t }}</span>
        </button>
      </div>
    </div>
    <div class="field"><div class="lbl">Notes</div><textarea v-model="form.notes" class="input" placeholder="Parking, tee pads, which baskets are out…"></textarea></div>
    <button v-if="existing" class="btn block danger" style="margin-top: 22px" @click="remove">Delete course</button>
    <template #foot>
      <button class="btn disc" @click="save">{{ existing ? 'Save changes' : 'Add course' }}</button>
    </template>
  </SheetFrame>
</template>
