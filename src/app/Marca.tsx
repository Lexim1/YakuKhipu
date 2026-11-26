import { Link } from 'react-router'

export function Marca({ vista }: { vista: string }) {
  return (
    <Link to="/" className="marca" aria-label={`YakuKhipu, ${vista}. Ir al inicio`}>
      <img className="marca__logo" src="/logo.png" alt="" width={36} height={36} />
      <span>
        <span className="marca__nombre">YakuKhipu</span>
        <span className="marca__vista">{vista}</span>
      </span>
    </Link>
  )
}
