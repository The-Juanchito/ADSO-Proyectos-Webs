import { useNavigate } from 'react-router-dom'

export default function BotonVolver({ a = '/', etiqueta = 'Volver' }) {
  const navigate = useNavigate()

  const volver = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(a)
    }
  }

  return (
    <button type="button" className="btn-volver" onClick={volver}>
      <i className="bi bi-arrow-left" />
      <span>{etiqueta}</span>
    </button>
  )
}
