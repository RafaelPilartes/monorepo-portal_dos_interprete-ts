import { useId, useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '../lib/utils'

export interface FileUploadProps {
  label: string
  /** MIME types accepted, e.g. ["application/pdf", "image/jpeg"]. */
  accept: string[]
  /** Largest file in bytes. */
  maxBytes: number
  onSelect: (file: File) => void
  disabled?: boolean | undefined
  className?: string | undefined
}

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`

/**
 * Picks one file and checks type and size on the device; the server checks
 * again when it signs the upload (api.md §6). Only hands a valid file over.
 */
export function FileUpload({ label, accept, maxBytes, onSelect, disabled, className }: FileUploadProps) {
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!accept.includes(file.type)) {
      setError('Este tipo de ficheiro não é aceite.')
      setFileName(null)
      return
    }
    if (file.size > maxBytes) {
      setError(`O ficheiro é demasiado grande. O máximo é ${formatSize(maxBytes)}.`)
      setFileName(null)
      return
    }
    setError(null)
    setFileName(file.name)
    onSelect(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="h-4 w-4" />
        <span>{fileName ?? label}</span>
      </label>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept.join(',')}
        disabled={disabled}
        onChange={handleChange}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
