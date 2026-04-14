import { FileText, X } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}


export function FileChip({
  file, onRemove,
}: Readonly<{ file: File; onRemove: () => void }>) {
  return (
    <div className="flex items-center gap-1.5 bg-surface border border-border-main rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-secondary-text max-w-[180px]">
      <FileText size={11} className="shrink-0 text-muted-text" />
      <span className="truncate">{file.name.slice(0, 18)}{file.name.length > 18 ? '…' : ''}</span>
      <span className="text-muted-text shrink-0">{formatBytes(file.size)}</span>
      <button
        onClick={onRemove}
        className="shrink-0 text-muted-text hover:text-primary-text transition-colors cursor-pointer ml-0.5"
      >
        <X size={10} strokeWidth={3} />
      </button>
    </div>
  )
}

