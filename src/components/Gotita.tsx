import alDia from '../assets/gota/al-dia.png'
import atenta from '../assets/gota/atenta.png'
import avatar from '../assets/gota/avatar.png'
import hola from '../assets/gota/hola.png'
import logrado from '../assets/gota/logrado.png'
import pensando from '../assets/gota/pensando.png'
import verificando from '../assets/gota/verificando.png'
import plazoAzul from '../assets/gota/plazo-azul.png'
import plazoNaranja from '../assets/gota/plazo-naranja.png'
import plazoRojo from '../assets/gota/plazo-rojo.png'
import avatarAzul from '../assets/gota/avatar-azul.png'
import avatarNaranja from '../assets/gota/avatar-naranja.png'
import avatarRojo from '../assets/gota/avatar-rojo.png'
import avatarAlerta from '../assets/gota/avatar-alerta.png'

// «Yaku», la gotita con khipu de YakuKhipu. Es decorativa: el texto de al lado da el significado.

const POSES = {
  hola,
  'al-dia': alDia,
  atenta,
  pensando,
  verificando,
  logrado,
  avatar,
  'plazo-azul': plazoAzul,
  'plazo-naranja': plazoNaranja,
  'plazo-rojo': plazoRojo,
  'avatar-azul': avatarAzul,
  'avatar-naranja': avatarNaranja,
  'avatar-rojo': avatarRojo,
  'avatar-alerta': avatarAlerta,
}

export type PoseGotita = keyof typeof POSES

export function Gotita({
  pose,
  alto = 120,
  animada = true,
  className = '',
}: {
  pose: PoseGotita
  alto?: number
  animada?: boolean
  className?: string
}) {
  return (
    <img
      src={POSES[pose]}
      alt=""
      aria-hidden="true"
      height={alto}
      style={{ height: alto, width: 'auto' }}
      className={`gotita gotita--${pose}${animada ? ' gotita--animada' : ''} ${className}`.trim()}
      draggable={false}
    />
  )
}
