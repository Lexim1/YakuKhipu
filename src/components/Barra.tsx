interface Props {
  /** null cuando el backend no cuenta días (plazo pendiente de validación): no se dibuja la barra. */
  usado: number | null
  total: number | null
  tono?: 'ok' | 'marca' | 'aviso' | 'peligro'
  etiqueta: string
}

/** Barra de avance. Los días los calcula el backend; aquí solo se dibujan. */
export function Barra({ usado, total, tono = 'ok', etiqueta }: Props) {
  if (usado == null || total == null) return null
  const porcentaje = total > 0 ? Math.min(100, Math.round((usado / total) * 100)) : 0
  return (
    <div
      className="barra"
      role="meter"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(usado, total)}
      aria-valuetext={`${usado} de ${total}`}
    >
      <div className={`barra__relleno barra__relleno--${tono}`} style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
