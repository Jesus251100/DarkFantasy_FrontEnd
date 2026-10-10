import { computed, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '../api/cliente'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'

type SolicitudCodigo = { ok: boolean; bandeja?: string }

export function useRegistro() {
  const router = useRouter()
  const auth = useAuthStore()
  const progress = useProgressStore()

  const username = shallowRef('')
  const email = shallowRef('')
  const password = shallowRef('')
  const confirmPassword = shallowRef('')
  const showVerify = shallowRef(false)
  const showAccountCreated = shallowRef(false)
  const toast = shallowRef<string | null>(null)
  const bandeja = shallowRef<string | null>(null)
  const cargando = shallowRef(false)
  const resendSeconds = shallowRef(0)

  const emailDisplay = computed(() => email.value.trim() || 'usuario@gmail.com')
  const canResend = computed(() => resendSeconds.value <= 0 && !cargando.value)
  const resendLabel = computed(() => {
    if (resendSeconds.value > 0) {
      const m = Math.floor(resendSeconds.value / 60)
      const s = resendSeconds.value % 60
      return `Reenviar (${m}:${s.toString().padStart(2, '0')})`
    }
    return 'Reenviar'
  })

  let resendTimer: ReturnType<typeof setInterval> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  let createdTimer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    toast.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.value = null
    }, 2800)
  }

  function startResendCountdown(seconds = 20) {
    resendSeconds.value = seconds
    if (resendTimer) clearInterval(resendTimer)
    resendTimer = setInterval(() => {
      if (resendSeconds.value <= 1) {
        resendSeconds.value = 0
        if (resendTimer) clearInterval(resendTimer)
        resendTimer = null
        return
      }
      resendSeconds.value -= 1
    }, 1000)
  }

  function validarFormulario(): string | null {
    if (!username.value.trim()) return 'Ingresa un nombre de usuario'
    if (!email.value.includes('@')) return 'Ingresa un correo válido'
    if (password.value.length < 4) return 'La contraseña debe tener al menos 4 caracteres'
    if (password.value !== confirmPassword.value) return 'Las contraseñas no coinciden'
    return null
  }

  async function pedirCodigo() {
    const data = await api<SolicitudCodigo>('/api/auth/solicitar-codigo', {
      method: 'POST',
      body: JSON.stringify({ correo: email.value.trim() }),
    })
    bandeja.value = data.bandeja ?? null
  }

  async function continuar() {
    const fallo = validarFormulario()
    if (fallo) {
      showToast(fallo)
      return
    }
    cargando.value = true
    try {
      await pedirCodigo()
      showVerify.value = true
      startResendCountdown(20)
      showToast(
        bandeja.value
          ? 'Código enviado. Ábrelo en la bandeja de Docker.'
          : `Código enviado a ${email.value.trim()}`,
      )
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'No se pudo enviar el código')
    } finally {
      cargando.value = false
    }
  }

  async function reenviarCodigo() {
    if (!canResend.value) return
    cargando.value = true
    try {
      await pedirCodigo()
      startResendCountdown(20)
      showToast('Código reenviado')
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'No se pudo reenviar')
    } finally {
      cargando.value = false
    }
  }

  async function verificarCodigo(codigo: string) {
    if (codigo.length < 6) {
      showToast('Ingresa los 6 dígitos')
      return
    }
    cargando.value = true
    try {
      await auth.registrar(email.value.trim(), password.value, username.value.trim(), codigo)
      await progress.hidratarDesdeApi()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'No se pudo registrar')
      cargando.value = false
      return
    }
    cargando.value = false
    showToast('Código correcto')
    if (resendTimer) clearInterval(resendTimer)
    resendTimer = null
    showVerify.value = false
    showAccountCreated.value = true
    if (createdTimer) clearTimeout(createdTimer)
    createdTimer = setTimeout(() => {
      showAccountCreated.value = false
      router.push('/lobby')
    }, 4000)
  }

  function cerrarVerify() {
    if (cargando.value) return
    showVerify.value = false
    if (resendTimer) clearInterval(resendTimer)
    resendTimer = null
  }

  onUnmounted(() => {
    if (resendTimer) clearInterval(resendTimer)
    if (toastTimer) clearTimeout(toastTimer)
    if (createdTimer) clearTimeout(createdTimer)
  })

  return {
    username,
    email,
    password,
    confirmPassword,
    showVerify,
    showAccountCreated,
    toast,
    bandeja,
    cargando,
    emailDisplay,
    canResend,
    resendLabel,
    continuar,
    reenviarCodigo,
    verificarCodigo,
    cerrarVerify,
  }
}
