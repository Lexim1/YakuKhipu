// USUARIOS DE DEMOSTRACIÓN con los mismos identificadores que crea el backend (scripts/semilla.py).
// Solo se usan con VITE_USAR_EJEMPLOS=true. Se identifican por su cargo, nunca por un nombre.
// Los ejemplos de la vista EPS son de EPS Tacna, por eso solo se incluye esa EPS.

import type { Sesion } from '../types/sesion'

/** Contraseña común de las cuentas de demostración. No es una credencial real. */
export const CLAVE_DEMO = 'yakukhipu2026'

export const USUARIOS_DEMO: Sesion[] = [
  {
    usuario_id: 'sunass-srt',
    nombre: 'Especialista SRT · Equipo 1',
    perfil: 'sunass',
    eps_id: null,
    eps: null,
    simulado: true,
  },
  {
    usuario_id: 'sunass-subdireccion',
    nombre: 'Subdirección SRT',
    perfil: 'sunass',
    eps_id: null,
    eps: null,
    simulado: true,
  },
  {
    usuario_id: 'eps-tacna',
    nombre: 'Gerencia Comercial · EPS Tacna',
    perfil: 'eps',
    eps_id: 'eps-tacna',
    eps: 'EPS Tacna',
    simulado: true,
  },
]
