import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Upload, Trash2, FileText, FileImage, File,
  Loader2, ExternalLink, X, FolderOpen,
} from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import toast from 'react-hot-toast'
import { DocumentService, type DocumentItem } from '../../services/documentService'

const PAGE_SIZE = 18

function formatSize(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FileIcon({ type, className }: { type: string; className?: string }) {
  if (type.startsWith('image/')) return <FileImage className={className} />
  if (type === 'application/pdf') return <FileText className={className} />
  return <File className={className} />
}

function fileTypeLabel(type: string) {
  if (type === 'application/pdf') return 'PDF'
  if (type.startsWith('image/')) return type.split('/')[1].toUpperCase()
  if (type.includes('spreadsheet') || type.includes('excel')) return 'XLS'
  return type.split('/')[1]?.toUpperCase() ?? 'FILE'
}

export default function DocumentsPage() {
  const [docs, setDocs]           = useState<DocumentItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [hasMore, setHasMore]     = useState(true)
  const [search, setSearch]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const pageRef      = useRef(0)
  const isLoading$   = useRef(false)
  const sentinelRef  = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback((reset = false) => {
    if (isLoading$.current) return
    isLoading$.current = true
    if (reset) setLoading(true)
    if (reset) { pageRef.current = 0; setHasMore(true) }
    DocumentService.fetchDocuments(pageRef.current, PAGE_SIZE, search.trim())
      .then(res => {
        const items = res.data?.content ?? []
        setDocs(prev => reset ? items : [...prev, ...items])
        pageRef.current += 1
        setHasMore(!res.data?.last)
      })
      .catch((err : Error) => toast.error(err.message || 'Failed to load documents'))
      .finally(() => { isLoading$.current = false; setLoading(false) })
  }, [search])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => load(true), 300)
    return () => clearTimeout(t)
  }, [load])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading$.current) load(false)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, load])

  // Drag-and-drop
  useEffect(() => {
    const over  = (e: DragEvent) => { e.preventDefault(); setIsDragging(true) }
    const leave = (e: DragEvent) => { if (!e.relatedTarget) setIsDragging(false) }
    const drop  = (e: DragEvent) => {
      e.preventDefault(); setIsDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length) handleUploadFiles(files)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUploadFiles = async (files: File[]) => {
    if (uploading) return
    setUploading(true)
    let uploaded = 0
    for (const file of files) {
      try {
        const res = await DocumentService.uploadDocument(file)
        if (res.success) uploaded++
        else toast.error(`Failed to upload ${file.name}`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`)
      load(true)
    }
  }

  const handleDelete = (doc: DocumentItem) => {
    if (deletingId !== null) return
    setDeletingId(doc.id)
    const removeDoc = (prev: DocumentItem[]) => prev.filter(d => d.id !== doc.id)
    DocumentService.deleteDocument(doc.id)
      .then(res => {
        if (res.success) { setDocs(removeDoc); toast.success('Document deleted') }
        else toast.error(res.message || 'Failed to delete')
      })
      .catch((err: Error) => toast.error(err.message || 'Failed to delete'))
      .finally(() => setDeletingId(null))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="absolute inset-6 rounded-[28px] border-2 border-dashed border-white/20" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Upload size={28} className="text-white" />
            </div>
            <span className="text-[18px] font-black text-white tracking-tight">Drop files to upload</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 md:px-8 pt-6 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[26px] font-black text-primary-text tracking-tight leading-tight">Documents</h1>
          <p className="text-[12px] text-muted-text font-medium mt-0.5">Upload, search and manage your files</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-btn-primary text-btn-primary-fg text-[13px] font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading…' : 'Upload Files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) handleUploadFiles(Array.from(e.target.files)); e.target.value = '' }}
        />
      </div>

      {/* Search */}
      <div className="px-5 md:px-8 pb-4 shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[42px] pl-10 pr-9 bg-card border border-border-main rounded-xl text-[13px] font-medium text-primary-text outline-none focus:border-secondary-text transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary-text transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Document grid */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-10">
        {loading && docs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} height={96} borderRadius={16} />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FolderOpen size={40} className="text-muted-text/25 mb-4" />
            <p className="text-[14px] font-bold text-muted-text">No documents found</p>
            <p className="text-[12px] text-muted-text/60 mt-1">Upload files or try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="group bg-card border border-border-main rounded-2xl p-4 flex items-center gap-3 hover:border-border-main/80 hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div className="w-11 h-11 shrink-0 rounded-xl bg-surface border border-border-main flex items-center justify-center text-muted-text">
                  <FileIcon type={doc.fileType} className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-primary-text truncate leading-snug">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold text-muted-text/60 bg-surface border border-border-main/50 px-1.5 py-0.5 rounded-md">
                      {fileTypeLabel(doc.fileType)}
                    </span>
                    <span className="text-[11px] text-muted-text font-medium">{formatSize(doc.size)}</span>
                    <span className="text-[11px] text-muted-text/50">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted-text hover:text-primary-text transition-colors"
                    title="Open"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-text hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === doc.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
        {!loading && docs.length > 0 && !hasMore && (
          <p className="text-center text-[11px] text-muted-text/40 font-medium py-4">All documents loaded</p>
        )}
        {!loading && docs.length > 0 && hasMore && isLoading$.current && (
          <div className="py-4 flex justify-center">
            <Skeleton height={40} width={120} borderRadius={8} />
          </div>
        )}
      </div>
    </div>
  )
}
