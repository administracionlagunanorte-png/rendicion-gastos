'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Camera, ImagePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return 'Solo se permiten archivos JPG y PNG'
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'El archivo no puede exceder los 5MB'
    }
    return null
  }

  const uploadFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al subir la imagen')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Imagen subida correctamente')
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input
    if (e.target) e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
  }

  if (value) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-border w-fit">
        <img
          src={value}
          alt="Comprobante de gasto"
          className="w-24 h-24 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed
          transition-colors cursor-pointer
          ${isDragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-emerald-50/50'
          }
          ${disabled || isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
            <span className="text-xs text-muted-foreground">Subiendo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Arrastra o haz clic para subir
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              JPG, PNG - máx. 5MB
            </span>
          </div>
        )}
      </div>

      {/* Regular file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Upload className="h-3 w-3 mr-1" />
          Examinar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs flex-1"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Camera className="h-3 w-3 mr-1" />
          Cámara
        </Button>
      </div>
    </div>
  )
}
