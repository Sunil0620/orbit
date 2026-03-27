import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { uploadMessageFile } from '../../api/messages'
import extractApiErrors from '../../utils/extractApiErrors'

function isPreviewableImage(fileType) {
  return typeof fileType === 'string' && fileType.startsWith('image/')
}

function AttachmentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.48l9.2-9.2a4 4 0 1 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
    </svg>
  )
}

const FileUpload = forwardRef(function FileUpload(
  { channel, onUploadComplete },
  ref,
) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef(null)

  const clearUpload = () => {
    setUploadedFile(null)
    setUploadProgress(0)
    setUploadError('')

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useImperativeHandle(ref, () => ({
    clearUpload,
  }))

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]

    clearUpload()
    onUploadComplete?.(null)

    if (!file) {
      return
    }

    if (isPreviewableImage(file.type)) {
      setPreviewUrl(window.URL.createObjectURL(file))
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const response = await uploadMessageFile(file, (progressEvent) => {
        if (!progressEvent.total) {
          return
        }

        setUploadProgress(
          Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100)),
        )
      })

      setUploadedFile(response)
      setUploadProgress(100)
      onUploadComplete?.(response)
    } catch (error) {
      const normalizedErrors = extractApiErrors(error)

      setUploadedFile(null)
      setUploadProgress(0)
      setUploadError(
        normalizedErrors.file ??
          normalizedErrors.form ??
          'Unable to upload that file right now.',
      )
      onUploadComplete?.(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <label className="orbit-secondary-button inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <AttachmentIcon />
          Attach
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={!channel || isUploading}
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
        />
      </label>

      {isUploading || uploadError || uploadedFile ? (
        <div className="space-y-3 sm:col-span-3 sm:row-start-2">
          {isUploading ? (
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
              Uploading {uploadProgress}%
            </p>
          ) : uploadedFile ? (
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">
              Upload complete
            </p>
          ) : null}

          {isUploading ? (
            <div className="h-2 overflow-hidden rounded-full bg-[var(--orbit-surface-soft)]">
              <div
                className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          ) : null}

          {uploadError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {uploadError}
            </div>
          ) : null}

          {uploadedFile ? (
            <div className="rounded-3xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={uploadedFile.file_name}
                  className="max-h-40 w-auto rounded-2xl object-cover"
                />
              ) : (
                <div className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-0)] px-4 py-3 text-sm text-[var(--orbit-text-muted)]">
                  <span className="rounded-xl bg-cyan-400/10 px-3 py-2 text-[var(--orbit-text)]">
                    File
                  </span>
                  <span className="break-all">{uploadedFile.file_name}</span>
                </div>
              )}

              <p className="mt-3 text-sm text-[var(--orbit-text)]">{uploadedFile.file_name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--orbit-text-subtle)]">
                {uploadedFile.file_type} ready to attach
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
})

export default FileUpload
