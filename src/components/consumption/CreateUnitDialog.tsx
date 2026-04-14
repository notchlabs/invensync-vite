import { useState } from "react"
import { SitesService, type CreateConsumptionUnitRecord } from "../../services/sitesService"
import toast from "react-hot-toast"

interface CreateUnitDialogProps {
  onClose: () => void
  onSuccess: () => void
  siteId: number
}

export function CreateUnitDialog({ onClose, onSuccess, siteId }: CreateUnitDialogProps) {
  const [dsrNo, setDsrNo] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!dsrNo.trim()) e.dsrNo = 'Required'
    if (!label.trim()) e.label = 'Required'
    if (!description.trim()) e.description = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      const record: CreateConsumptionUnitRecord = {
        dsrNo: dsrNo.trim(),
        label: label.trim(),
        description: description.trim(),
        quantity: null,
        unit: '',
      }
      await SitesService.createConsumptionUnits(siteId, [record])
      toast.success('Consumption unit created')
      onSuccess()
    } catch {
      toast.error('Failed to create unit')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-[440px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border-main)]">
          <h2 className="text-[16px] font-black text-[var(--text-primary)] tracking-tight">Create Consumption Unit</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Add a new consumption unit to this site.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* DSR No */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dsr-no" className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              DSR No. <span className="text-rose-500">*</span>
            </label>
            <input
              id="dsr-no"
              type="text"
              value={dsrNo}
              onChange={e => { setDsrNo(e.target.value); setErrors(p => ({ ...p, dsrNo: '' })) }}
              placeholder="e.g. Store Infrastructure"
              className={`h-[40px] px-3 bg-[var(--bg-surface)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)] transition-all ${errors.dsrNo ? 'border-rose-500' : 'border-[var(--border-main)]'}`}
            />
            {errors.dsrNo && <span className="text-[11px] text-rose-500 font-medium">{errors.dsrNo}</span>}
          </div>

          {/* Unit Label */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit-label" className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              Unit Label <span className="text-rose-500">*</span>
            </label>
            <input
              id="unit-label"
              type="text"
              value={label}
              onChange={e => { setLabel(e.target.value); setErrors(p => ({ ...p, label: '' })) }}
              placeholder="e.g. Wild Bean Cafe"
              className={`h-[40px] px-3 bg-[var(--bg-surface)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)] transition-all ${errors.label ? 'border-rose-500' : 'border-[var(--border-main)]'}`}
            />
            {errors.label && <span className="text-[11px] text-rose-500 font-medium">{errors.label}</span>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit-desc" className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="unit-desc"
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
              placeholder="Describe the purpose of this unit..."
              rows={3}
              className={`px-3 py-2.5 bg-[var(--bg-surface)] border rounded-lg text-[13px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)] transition-all resize-none ${errors.description ? 'border-rose-500' : 'border-[var(--border-main)]'}`}
            />
            {errors.description && <span className="text-[11px] text-rose-500 font-medium">{errors.description}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-main)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border-main)] text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-black hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? 'Creating...' : 'Create Unit'}
          </button>
        </div>
      </div>
    </div>
  )
}