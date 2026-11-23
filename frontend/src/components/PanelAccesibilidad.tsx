import { useEffect, useState } from 'react'
import { Dialogo } from './Dialogo'
import { IconoAccesibilidad, IconoCerrar } from './Iconos'

interface Ajustes {
  escala: number
  contraste: boolean
  negrita: boolean
  interlineado: boolean
  espaciado: boolean
  alineacion: 'izquierda' | 'centro' | 'derecha'
  cursor: boolean
  enlaces: boolean
  saturacion: boolean
  dislexica: boolean
  daltonismo: Daltonismo
}

type Daltonismo = 'ninguno' | 'protanopia' | 'deuteranopia' | 'tritanopia'

const DALTONISMO: { valor: Daltonismo; texto: string }[] = [
  { valor: 'ninguno', texto: 'Filtro daltonismo' },
  { valor: 'protanopia', texto: 'Filtro: protanopía' },
  { valor: 'deuteranopia', texto: 'Filtro: deuteranopía' },
  { valor: 'tritanopia', texto: 'Filtro: tritanopía' },
]

/** Matrices de corrección de color (daltonización) para cada tipo de daltonismo. */
const MATRICES: Record<Exclude<Daltonismo, 'ninguno'>, string> = {
  protanopia: '1 0 0 0 0  -0.255 1.255 0 0 0  0.303 -0.545 1.242 0 0  0 0 0 1 0',
  deuteranopia: '1 0 0 0 0  -0.438 1.438 0 0 0  0.262 -0.562 1.3 0 0  0 0 0 1 0',
  tritanopia: '1 0 0 0 0  0.035 1.532 -0.567 0 0  0.035 -0.51 1.475 0 0  0 0 0 1 0',
}

const INICIALES: Ajustes = {
  escala: 1,
  contraste: false,
  negrita: false,
  interlineado: false,
  espaciado: false,
  alineacion: 'izquierda',
  cursor: false,
  enlaces: false,
  saturacion: false,
  dislexica: false,
  daltonismo: 'ninguno',
}

const CLAVE = 'yakukhipu-accesibilidad'

function leer(): Ajustes {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return guardado ? { ...INICIALES, ...JSON.parse(guardado) } : INICIALES
  } catch {
    return INICIALES
  }
}

function aplicar(a: Ajustes) {
  const raiz = document.documentElement
  raiz.style.setProperty('--escala-texto', String(a.escala))
  raiz.style.setProperty('--interlineado', a.interlineado ? '1.9' : '1.5')
  raiz.style.setProperty('--espaciado-letras', a.espaciado ? '0.06em' : 'normal')
  raiz.classList.toggle('alto-contraste', a.contraste)
  raiz.classList.toggle('texto-negrita', a.negrita)
  raiz.classList.toggle('cursor-grande', a.cursor)
  raiz.classList.toggle('resaltar-enlaces', a.enlaces)
  raiz.classList.toggle('saturacion-baja', a.saturacion)
  raiz.classList.toggle('alinear-centro', a.alineacion === 'centro')
  raiz.classList.toggle('alinear-derecha', a.alineacion === 'derecha')
  raiz.classList.toggle('fuente-dislexica', a.dislexica)
  // La fuente solo se descarga si alguien activa la opción.
  if (a.dislexica) void import('@fontsource/opendyslexic')
  for (const { valor } of DALTONISMO) raiz.classList.toggle(`filtro-${valor}`, a.daltonismo === valor)
}

/** Botón «Accesibilidad» de la cabecera y su panel de configuración. */
export function Accesibilidad() {
  const [abierto, setAbierto] = useState(false)
  const [ajustes, setAjustes] = useState<Ajustes>(leer)
  const [leyendo, setLeyendo] = useState(false)

  useEffect(() => {
    aplicar(ajustes)
    try {
      localStorage.setItem(CLAVE, JSON.stringify(ajustes))
    } catch {
      // Sin almacenamiento: los ajustes duran solo esta visita.
    }
  }, [ajustes])

  const cambiar = <K extends keyof Ajustes>(clave: K, valor: Ajustes[K]) =>
    setAjustes((a) => ({ ...a, [clave]: valor }))

  function leerTexto() {
    if (!('speechSynthesis' in window)) return
    if (leyendo) {
      speechSynthesis.cancel()
      setLeyendo(false)
      return
    }
    const texto = document.getElementById('contenido')?.innerText ?? ''
    const voz = new SpeechSynthesisUtterance(texto)
    voz.lang = 'es-PE'
    voz.onend = () => setLeyendo(false)
    speechSynthesis.speak(voz)
    setLeyendo(true)
  }

  const interruptores: { clave: keyof Ajustes; texto: string; simbolo: string }[] = [
    { clave: 'contraste', texto: 'Alto contraste', simbolo: '◐' },
    { clave: 'negrita', texto: 'Aumentar peso de fuente', simbolo: 'B' },
    { clave: 'dislexica', texto: 'Fuente disléxica', simbolo: 'A' },
    { clave: 'interlineado', texto: 'Espaciado de líneas', simbolo: '↕' },
    { clave: 'espaciado', texto: 'Espaciado de letras', simbolo: '↔' },
  ]
  const navegacion: { clave: keyof Ajustes; texto: string; simbolo: string }[] = [
    { clave: 'cursor', texto: 'Cursor grande', simbolo: '➤' },
    { clave: 'enlaces', texto: 'Resaltar enlaces', simbolo: '🔗' },
    { clave: 'saturacion', texto: ajustes.saturacion ? 'Saturación (baja)' : 'Saturación (normal)', simbolo: '◍' },
  ]

  return (
    <>
      <button type="button" className="boton-accesibilidad" onClick={() => setAbierto(true)} aria-haspopup="dialog">
        <IconoAccesibilidad tamano={16} />
        <span className="boton-accesibilidad__texto">Accesibilidad</span>
        <span className="solo-lectores">: configuración</span>
      </button>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        {Object.entries(MATRICES).map(([tipo, matriz]) => (
          <filter key={tipo} id={`filtro-${tipo}`}>
            <feColorMatrix type="matrix" values={matriz} />
          </filter>
        ))}
      </svg>
      <Dialogo
        abierto={abierto}
        titulo="Configuración de accesibilidad"
        alCerrar={() => setAbierto(false)}
        lateral
        sinCabecera
      >
        <div className="panel-lateral__cabecera">
          <span>Configuración de Accesibilidad</span>
          <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">
            <IconoCerrar tamano={18} />
          </button>
        </div>
        <div className="panel-lateral__cuerpo">
          <p className="panel-lateral__titulo">Configuraciones de contenido</p>
          <div className="recuadro">
            <label className="escala">
              <strong aria-hidden="true">Tt</strong>
              Escala de fuente
              <input
                type="range"
                min={0.8}
                max={1.6}
                step={0.1}
                value={ajustes.escala}
                onChange={(e) => cambiar('escala', Number(e.target.value))}
              />
              <span>{ajustes.escala.toFixed(1)}</span>
            </label>
          </div>
          <div className="ajustes">
            <button
              type="button"
              className="ajuste"
              aria-pressed={ajustes.contraste}
              onClick={() => cambiar('contraste', !ajustes.contraste)}
            >
              <span aria-hidden="true">◐</span>Alto contraste
            </button>
            <button type="button" className="ajuste" aria-pressed={leyendo} onClick={leerTexto}>
              <span aria-hidden="true">🔊</span>
              {leyendo ? 'Detener lectura' : 'Leer texto'}
            </button>
            {interruptores.slice(1).map((a) => (
              <button
                key={a.clave}
                type="button"
                className="ajuste"
                aria-pressed={Boolean(ajustes[a.clave])}
                onClick={() => cambiar(a.clave, !ajustes[a.clave] as never)}
              >
                <span aria-hidden="true">{a.simbolo}</span>
                {a.texto}
              </button>
            ))}
          </div>
          <fieldset className="recuadro" style={{ margin: 0 }}>
            <legend
              className="texto-pequeno"
              style={{ fontWeight: 700, padding: 0, float: 'left', width: '100%', marginBottom: 8 }}
            >
              Alineación de texto
            </legend>
            <div className="ajustes" style={{ gridTemplateColumns: 'repeat(3, 1fr)', clear: 'both' }}>
              {(['izquierda', 'centro', 'derecha'] as const).map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className="ajuste"
                  style={{ minHeight: 40 }}
                  aria-pressed={ajustes.alineacion === valor}
                  onClick={() => cambiar('alineacion', valor)}
                >
                  {valor[0].toUpperCase() + valor.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="panel-lateral__titulo">Configuraciones de navegación</p>
          <div className="ajustes">
            {navegacion.map((a) => (
              <button
                key={a.clave}
                type="button"
                className="ajuste"
                aria-pressed={Boolean(ajustes[a.clave])}
                onClick={() => cambiar(a.clave, !ajustes[a.clave] as never)}
              >
                <span aria-hidden="true">{a.simbolo}</span>
                {a.texto}
              </button>
            ))}
          </div>
          <div className="ajustes">
            <button
              type="button"
              className="ajuste"
              aria-pressed={ajustes.daltonismo !== 'ninguno'}
              onClick={() => {
                const i = DALTONISMO.findIndex((d) => d.valor === ajustes.daltonismo)
                cambiar('daltonismo', DALTONISMO[(i + 1) % DALTONISMO.length].valor)
              }}
            >
              <span aria-hidden="true">🎨</span>
              {DALTONISMO.find((d) => d.valor === ajustes.daltonismo)?.texto}
            </button>
          </div>
          <button type="button" className="boton boton--secundario" onClick={() => setAjustes(INICIALES)}>
            Restablecer
          </button>
        </div>
      </Dialogo>
    </>
  )
}
