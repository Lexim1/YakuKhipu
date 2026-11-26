import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useContextoAgente } from '../../agente/useAgente'
import { Chip, Fuente, type Tono } from '../../components/Chip'
import { IconoAlerta, IconoDocumento, IconoFlecha, IconoLista } from '../../components/Iconos'
import { Contenido, SinResultados } from '../../components/Mensajes'
import { listarAlertas } from '../../services/tramites'
import { useConsulta } from '../../services/useConsulta'
import type { Alerta, TipoAlerta } from '../../types/tramite'

const TIPOS: Record<TipoAlerta, { tono: Tono; texto: string; icono: ReactNode; grupo: Grupo }> = {
  reporte_faltante: { tono: 'aviso', texto: 'Reporte faltante', icono: <IconoDocumento tamano={20} />, grupo: 'calidad' },
  avance_inconsistente: { tono: 'aviso', texto: 'Avance por verificar', icono: <IconoAlerta tamano={20} />, grupo: 'calidad' },
  dato_duplicado: { tono: 'aviso', texto: 'Dato duplicado', icono: <IconoLista tamano={20} />, grupo: 'calidad' },
  saldo_inconsistente: { tono: 'aviso', texto: 'Saldo por conciliar', icono: <IconoAlerta tamano={20} />, grupo: 'calidad' },
  deposito_insuficiente: { tono: 'aviso', texto: 'Depósito menor al programado', icono: <IconoAlerta tamano={20} />, grupo: 'calidad' },
  vencido: { tono: 'peligro', texto: 'Vencido', icono: <IconoAlerta tamano={20} />, grupo: 'plazos' },
  por_vencer: { tono: 'aviso', texto: 'Por vencer', icono: <IconoAlerta tamano={20} />, grupo: 'plazos' },
  cifra_sin_documento: {
    tono: 'aviso',
    texto: 'Cifra sin documento',
    icono: <IconoDocumento tamano={20} />,
    grupo: 'cifras',
  },
  documento_por_asociar: {
    tono: 'agente',
    texto: 'Documento por asociar',
    icono: <IconoDocumento tamano={20} />,
    grupo: 'documentos',
  },
  dos_numeraciones: { tono: 'info', texto: 'Dos numeraciones', icono: <IconoLista tamano={20} />, grupo: 'documentos' },
}

type Grupo = 'plazos' | 'cifras' | 'documentos' | 'calidad'

const GRUPOS: { id: Grupo | ''; texto: string }[] = [
  { id: '', texto: 'Todas' },
  { id: 'plazos', texto: 'Plazos' },
  { id: 'cifras', texto: 'Cifras' },
  { id: 'documentos', texto: 'Documentos' },
  { id: 'calidad', texto: 'Calidad de datos' },
]

function destino(alerta: Alerta) {
  if (alerta.destino.tipo === 'recepcion') return '/sunass/recepcion'
  const base = `/sunass/expedientes/${encodeURIComponent(alerta.destino.id)}`
  return alerta.destino.pestana && alerta.destino.pestana !== 'linea'
    ? `${base}?pestana=${alerta.destino.pestana}`
    : base
}

export function Alertas() {
  const [resultado, reintentar] = useConsulta((signal) => listarAlertas(signal), [])
  const [parametros, setParametros] = useSearchParams()
  const grupo = parametros.get('tipo') ?? ''

  useContextoAgente({
    espacio: 'Espacio SUNASS · Alertas',
    cartera: true,
    preguntas: [
      {
        pregunta: '¿Qué alerta atiendo primero?',
        respuesta:
          'Las dos vencidas: RP-2025-0001 (EPS Selva Alta) superó el plazo de referencia de su etapa y CPI-2026-0004 (EPS Manantial) lleva 37 de 30 días hábiles en Gerencia General.',
        fuentes: ['Bitácora del expediente'],
        palabras: ['primero', 'urgente', 'prioridad'],
      },
    ],
  })

  return (
    <div className="pagina">
      <div>
        <p className="antetitulo">SUNASS</p>
        <h1>Alertas</h1>
        <p className="subtitulo">Cada alerta dice qué regla la activó y de qué documento sale.</p>
      </div>

      <Contenido resultado={resultado} reintentar={reintentar} textoCarga="Cargando alertas…">
        {({ items }) => {
          const visibles = items.filter((a) => !grupo || TIPOS[a.tipo].grupo === grupo)
          return (
            <>
              <div className="pastillas" role="group" aria-label="Filtrar alertas">
                {GRUPOS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="pastilla"
                    aria-pressed={grupo === g.id}
                    onClick={() => setParametros(g.id ? { tipo: g.id } : {}, { replace: true })}
                  >
                    {g.texto} ({g.id ? items.filter((a) => TIPOS[a.tipo].grupo === g.id).length : items.length})
                  </button>
                ))}
              </div>
              {visibles.length === 0 ? (
                <SinResultados titulo="No hay alertas de este tipo">
                  <p className="texto-suave">No se detectaron alertas para este filtro en los registros disponibles.</p>
                </SinResultados>
              ) : (
                visibles.map((a) => {
                  const tipo = TIPOS[a.tipo]
                  return (
                    <article key={a.id} className="tarjeta alerta" aria-labelledby={`alerta-${a.id}`}>
                      <span
                        className={`icono-cuadro icono-cuadro--${tipo.tono}`}
                        style={{ width: 44, height: 44, borderRadius: 12 }}
                      >
                        {tipo.icono}
                      </span>
                      <div className="alerta__cuerpo">
                        <div className="fila-chips">
                          <Chip tono={tipo.tono}>{tipo.texto}</Chip>
                          <h2 id={`alerta-${a.id}`} className="alerta__titulo">
                            {a.titulo}
                          </h2>
                        </div>
                        <p style={{ fontWeight: 500 }}>{a.detalle}</p>
                        <div className="fila-chips">
                          <span className="nota">{a.regla}</span>
                          <Fuente>{a.fuente}</Fuente>
                        </div>
                      </div>
                      <Link className="boton boton--secundario" to={destino(a)}>
                        {a.accion}
                        <IconoFlecha tamano={16} />
                      </Link>
                    </article>
                  )
                })
              )}
            </>
          )
        }}
      </Contenido>
    </div>
  )
}
