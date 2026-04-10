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

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

const FileUpload = forwardRef(function FileUpload(
  { channel, directConversation, onUploadComplete, onUploadStateChange },
  ref,
) {
  const [uploadItems, setUploadItems] = useState([])
  const inputRef = useRef(null)
  const nextItemIdRef = useRef(0)
  const uploadItemsRef = useRef([])

  const revokePreview = (item) => {
    if (item?.previewUrl) {
      window.URL.revokeObjectURL(item.previewUrl)
    }
  }

  const clearUpload = () => {
    uploadItems.forEach(revokePreview)
    setUploadItems([])
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClearUpload = () => {
    clearUpload()
    onUploadComplete?.([])
    onUploadStateChange?.(false)
  }

  useEffect(() => {
    uploadItemsRef.current = uploadItems
  }, [uploadItems])

  useEffect(() => {
    return () => {
      uploadItemsRef.current.forEach(revokePreview)
    }
  }, [])

  useEffect(() => {
    onUploadComplete?.(
      uploadItems
        .filter((item) => item.status === 'uploaded' && item.response)
        .map((item) => item.response),
    )
    onUploadStateChange?.(uploadItems.some((item) => item.status === 'uploading'))
  }, [onUploadComplete, onUploadStateChange, uploadItems])

  useImperativeHandle(ref, () => ({
    clearUpload: handleClearUpload,
  }))

  const removeUploadItem = (itemId) => {
    setUploadItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item.id !== itemId)
      const removedItem = currentItems.find((item) => item.id === itemId)
      revokePreview(removedItem)
      return nextItems
    })
  }

  const updateUploadItem = (itemId, nextValues) => {
    setUploadItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...nextValues,
            }
          : item,
      ),
    )
  }

  const uploadSelectedFile = async (itemId, file) => {
    updateUploadItem(itemId, {
      status: 'uploading',
      progress: 0,
      error: '',
    })

    try {
      const response = await uploadMessageFile(file, (progressEvent) => {
        if (!progressEvent.total) {
          return
        }

        updateUploadItem(itemId, {
          progress: Math.min(
            100,
            Math.round((progressEvent.loaded / progressEvent.total) * 100),
          ),
        })
      })

      updateUploadItem(itemId, {
        status: 'uploaded',
        progress: 100,
        response,
        error: '',
      })
    } catch (error) {
      const normalizedErrors = extractApiErrors(error)

      updateUploadItem(itemId, {
        status: 'error',
        progress: 0,
        response: null,
        error:
          normalizedErrors.file ??
          normalizedErrors.form ??
          'Unable to upload that file right now.',
      })
    }
  }

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    const nextItems = files.map((file) => ({
      id: `attachment-${nextItemIdRef.current++}`,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      previewUrl: isPreviewableImage(file.type)
        ? window.URL.createObjectURL(file)
        : '',
      progress: 0,
      status: 'queued',
      error: '',
      response: null,
    }))

    setUploadItems((currentItems) => [...currentItems, ...nextItems])

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    await Promise.all(
      nextItems.map((item, index) => uploadSelectedFile(item.id, files[index])),
    )
  }

  return (
    <>
      <label
        className="orbit-secondary-button inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[0.95rem] text-sm"
        title="Attach file"
        aria-label="Attach file"
      >
        <span className="flex items-center justify-center">
          <AttachmentIcon />
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={!channel && !directConversation}
          onChange={handleFileSelect}
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt"
        />
      </label>

      {uploadItems.length > 0 ? (
        <div className="space-y-3 sm:col-span-3 sm:row-start-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--orbit-text-subtle)]">
            {uploadItems.length} attachment{uploadItems.length === 1 ? '' : 's'} in composer
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.fileName}
                        className="max-h-32 w-auto rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-0)] px-4 py-3 text-sm text-[var(--orbit-text-muted)]">
                        <span className="rounded-xl bg-cyan-400/10 px-3 py-2 text-[var(--orbit-text)]">
                          File
                        </span>
                        <span className="break-all">{item.fileName}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeUploadItem(item.id)}
                    className="orbit-secondary-button flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    aria-label={`Remove ${item.fileName}`}
                    title={`Remove ${item.fileName}`}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <p className="mt-3 truncate text-sm text-[var(--orbit-text)]">{item.fileName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--orbit-text-subtle)]">
                  {item.status === 'uploaded'
                    ? `${item.response?.file_type ?? item.fileType} ready`
                    : item.status === 'uploading'
                      ? `Uploading ${item.progress}%`
                      : item.status === 'error'
                        ? 'Upload failed'
                        : 'Queued'}
                </p>

                {item.status === 'uploading' ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--orbit-surface-0)]">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}

                {item.status === 'error' ? (
                  <p className="orbit-danger-text mt-3 text-sm">{item.error}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
})

export default FileUpload
