import { useState, useEffect, useRef } from 'react'
import { X, Upload, Package, Edit3, ShieldCheck, Tag, Loader2 } from 'lucide-react'
import { HsnSelect } from '../common/HsnSelect'
import { InventoryService } from '../../services/inventoryService'
import type { InventoryItem } from '../../types/inventory'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  onSuccess: () => void
}

export function EditProductModal({ isOpen, onClose, item, onSuccess }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    hsnCode: '',
    hsnName: '',
    cgstInPerc: 0,
    sgstInPerc: 0,
    imageUrl: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        name: item.productName || '',
        unit: item.unit || 'Pcs',
        hsnCode: String(item.hsnCode || ''),
        hsnName: item.hsnName || '',
        cgstInPerc: item.cgstInPerc || 0,
        sgstInPerc: item.sgstInPerc || 0,
        imageUrl: item.imageUrl || ''
      })
      setError(null)
    }
  }, [item, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    try {
      const res = await InventoryService.uploadAttachment(file)
      if (res.success && res.data?.docUrl) {
        setFormData(prev => ({ ...prev, imageUrl: res.data.docUrl }))
      } else {
        setError(res.message || 'Image upload failed')
      }
    } catch (err: any) {
      console.error('Image upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdate = async () => {
    if (!item) return
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        hsnCode: parseInt(formData.hsnCode),
        hsnName: formData.hsnName,
        imageUrl: formData.imageUrl,
        cgstInPerc: formData.cgstInPerc,
        sgstInPerc: formData.sgstInPerc
      }

      const res = await InventoryService.updateProduct(item.productId, payload)
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setError(res.message || 'Failed to update product')
      }
    } catch (err: any) {
      console.error('Update product error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-black text-primary-text tracking-tight flex items-center gap-2.5">
            <Edit3 className="text-primary-text" size={22} />
            Edit Product
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface border border-transparent hover:border-border-main rounded-lg text-muted-text transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Area */}
        <div className="px-6 py-2 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          
          {/* Top Section: Image + Name */}
          <div className="flex gap-4">
            {/* Image Preview / Upload */}
            <div 
              className="relative group w-[110px] h-[110px] shrink-0 cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-2xl border-2 border-border-main overflow-hidden bg-surface flex items-center justify-center relative">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <Package size={32} className="text-muted-text/30" />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              
              {!isUploading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-2xl transition-all backdrop-blur-[2px]">
                  <Upload size={18} className="mb-1" />
                  CHANGE
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Product Name */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text uppercase tracking-wider flex justify-between">
                Product Name
                <span className="text-[10px] text-muted-text lowercase font-medium">{formData.name.length}/500</span>
              </label>
              <textarea
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                maxLength={500}
                className="w-full h-[110px] px-3.5 py-3 bg-surface border border-border-main rounded-xl text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all resize-none"
                placeholder="Enter product name..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text uppercase tracking-wider flex justify-between">
                Unit
                <span className="text-[10px] text-muted-text lowercase font-medium">{formData.unit.length}/50</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                maxLength={50}
                className="w-full h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all"
              />
            </div>

            {/* HSN Code Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text uppercase tracking-wider">HSN Code</label>
              <HsnSelect
                value={{ code: formData.hsnCode, name: formData.hsnName }}
                onChange={hsn => setFormData({
                  ...formData,
                  hsnCode: hsn.code,
                  hsnName: hsn.name,
                  cgstInPerc: hsn.cgst,
                  sgstInPerc: hsn.sgst
                })}
              />
            </div>
          </div>

          {/* HSN Name / Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black text-primary-text uppercase tracking-wider flex items-center justify-between">
              HSN Description
              <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded opacity-0 group-hover:opacity-100">Auto-filled</span>
            </label>
            <div className="relative">
              <textarea
                value={formData.hsnName}
                onChange={e => setFormData({ ...formData, hsnName: e.target.value })}
                className="w-full h-[80px] px-3.5 py-2.5 bg-surface border border-border-main rounded-xl text-[12px] text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all italic leading-relaxed"
                placeholder="HSN description..."
              />
              <ShieldCheck size={14} className="absolute bottom-2 right-2 text-emerald-500 opacity-50" />
            </div>
          </div>

          {/* Tax Rates */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text uppercase tracking-wider">CGST (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.cgstInPerc}
                  onChange={e => setFormData({ ...formData, cgstInPerc: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
                <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text uppercase tracking-wider">SGST (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.sgstInPerc}
                  onChange={e => setFormData({ ...formData, sgstInPerc: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10"
                />
                <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text" />
              </div>
            </div>
          </div>

          {error && <p className="text-[12px] font-bold text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 bg-header border-t border-border-main flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[13px] font-bold text-secondary-text hover:text-primary-text border border-border-main rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary-text text-card text-[13px] font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Product'}
          </button>
        </div>
      </div>
    </div>
  )
}
