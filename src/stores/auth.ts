import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api/cliente'

export type Rol = 'jugador' | 'administrador'

export interface UsuarioSesion {
  id: string
  correo: string
  rol: Rol
  nombre: string
}

type AuthResponse = { token: string; usuario: UsuarioSesion }

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<UsuarioSesion | null>(leerUsuario())
  const autenticado = computed(() => !!usuario.value && !!leerToken())
  const esAdmin = computed(() => usuario.value?.rol === 'administrador')

  function persistir(token: string, u: UsuarioSesion) {
    localStorage.setItem('df_token', token)
    localStorage.setItem('df_user', JSON.stringify(u))
    sessionStorage.setItem('df_logged_in', '1')
    sessionStorage.setItem('df_user_role', u.rol)
    usuario.value = u
  }

  async function login(correo: string, clave: string, rol?: Rol) {
    const data = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, clave, rol }),
    })
    persistir(data.token, data.usuario)
    return data.usuario
  }

  async function registrar(correo: string, clave: string, nombre: string, codigo: string) {
    const data = await api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ correo, clave, nombre, codigo, rol: 'jugador' }),
    })
    persistir(data.token, data.usuario)
    return data.usuario
  }

  function setNombre(nombre: string) {
    if (!usuario.value) return
    usuario.value = { ...usuario.value, nombre }
    try {
      localStorage.setItem('df_user', JSON.stringify(usuario.value))
    } catch {
      /* ignore */
    }
  }

  function cerrar() {
    localStorage.removeItem('df_token')
    localStorage.removeItem('df_user')
    sessionStorage.removeItem('df_logged_in')
    sessionStorage.removeItem('df_user_role')
    usuario.value = null
    void import('./progress').then((m) => {
      m.useProgressStore().resetear()
    })
  }

  return { usuario, autenticado, esAdmin, login, registrar, setNombre, cerrar }
})

function leerToken() {
  try {
    return localStorage.getItem('df_token') ?? ''
  } catch {
    return ''
  }
}

function leerUsuario(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem('df_user')
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null
  } catch {
    return null
  }
}
