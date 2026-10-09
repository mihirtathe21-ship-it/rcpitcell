import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')
const FILE_ORIGIN = API_ORIGIN || (import.meta.env.DEV ? 'http://localhost:5000' : '')

const getImageUrl = image => {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  return `${FILE_ORIGIN}${image.startsWith('/') ? '' : '/'}${image}`
}

export default function CompanyLogo({ src, company, className = '' }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = getImageUrl(src)

  useEffect(() => setFailed(false), [imageUrl])

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      aria-label={`${company || 'Company'} logo`}
    >
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={`${company || 'Company'} logo`}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : company?.trim() ? (
        <span aria-hidden="true">{company.trim().charAt(0).toUpperCase()}</span>
      ) : (
        <Building2 aria-hidden="true" className="h-5 w-5" />
      )}
    </div>
  )
}
