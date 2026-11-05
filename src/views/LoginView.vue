<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '../data/store.js'
import { signIn, signUp, sendReset, setNewPassword } from '../data/session.js'
import { plateSvg } from '../lib/plate.js'
import { toast } from '../lib/toast.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const newPassword = ref('')
const msg = ref({ text: '', error: false })
const busy = ref(false)

// A fixed plate for the sign-in card — the same printed-map look as the rest of the app.
const plate = plateSvg({ id: 'signin', name: 'Fairway', terrain: 'hilly' }, { dot: 0.5 })

const say = (text, error = false) => { msg.value = { text, error } }

async function run(fn) {
  busy.value = true
  try { await fn() } catch (e) { say(e.message, true) } finally { busy.value = false }
}

const onSignIn = () => run(async () => {
  if (!email.value || !password.value) return say('Enter your email and password.', true)
  say('Signing in…')
  await signIn(email.value.trim(), password.value)
  router.replace(state.legacy ? '/import' : '/')
})

const onSignUp = () => run(async () => {
  if (!email.value || !password.value) return say('Enter an email and a password to create your account.', true)
  say('Creating account…')
  const ready = await signUp(email.value.trim(), password.value)
  if (ready) router.replace(state.legacy ? '/import' : '/')
  else say('Account created — check your email for a confirmation link, then sign in here.')
})

const onForgot = () => run(async () => {
  if (!email.value) return say('Type your email above first, then tap “Forgot password?” again.', true)
  say('Sending reset link…')
  await sendReset(email.value.trim())
  say('Reset link sent — check your email.')
})

const onNewPassword = () => run(async () => {
  if (newPassword.value.length < 6) return say('Password must be at least 6 characters.', true)
  say('Saving…')
  await setNewPassword(newPassword.value)
  toast('Password updated')
  router.replace(state.legacy ? '/import' : '/')
})
</script>

<template>
  <div class="signin">
    <div class="signin-card card">
      <div class="art signin-plate" v-html="plate" />
      <div class="signin-body">
        <div class="brand-row">
          <svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="var(--disc)" /><circle cx="17" cy="17" r="11" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" /><path d="M6.5 21c5-6.5 13-9 21.5-7.5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-dasharray=".5 3.4" /></svg>
          <div><b>Fairway</b><span class="mono">Disc golf log</span></div>
        </div>

        <template v-if="state.recovery">
          <h1>Set a new <em>password</em></h1>
          <p class="muted">Your reset link signed you in. Choose a new password to finish.</p>
          <div class="field"><div class="lbl">New password</div><input v-model="newPassword" class="input" type="password" autocomplete="new-password" @keydown.enter="onNewPassword" /></div>
          <p class="signin-msg" :class="{ err: msg.error }">{{ msg.text }}</p>
          <button class="btn disc block big" :disabled="busy" @click="onNewPassword">Save password</button>
        </template>

        <template v-else>
          <h1>Welcome <em>back</em></h1>
          <div class="field"><div class="lbl">Email</div><input v-model="email" class="input" type="email" autocomplete="username" placeholder="you@example.com" /></div>
          <div class="field">
            <div class="lbl">Password<button class="link" type="button" @click="onForgot">Forgot password?</button></div>
            <input v-model="password" class="input" type="password" autocomplete="current-password" @keydown.enter="onSignIn" />
          </div>
          <p class="signin-msg" :class="{ err: msg.error }">{{ msg.text }}</p>
          <button class="btn disc block big" :disabled="busy" @click="onSignIn">Sign in</button>
          <button class="btn block big" style="margin-top: 10px" :disabled="busy" @click="onSignUp">Create account</button>
        </template>
      </div>
    </div>
  </div>
</template>
