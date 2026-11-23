/** Aviso visible cuando la pantalla muestra datos simulados y no documentos verificados. */
export function AvisoSimulado({ texto }: { texto?: string }) {
  return (
    <p className="aviso-simulado">
      <strong>Datos de demostración.</strong>
      {texto ??
        'Los documentos de ejemplo se basan en expedientes reales; las cifras simuladas se marcan como «Simulado».'}
    </p>
  )
}
