import { useState, useEffect, useRef } from 'react'
import { X, Upload, Package, Edit3, ShieldCheck, Tag, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { HsnSelect } from '../common/HsnSelect'
import { InventoryService } from '../../services/inventoryService'
import { VALIDATION_LIMITS } from '../../config/validation'
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
        const msg = res.message || 'Image upload failed'
        setError(msg)
        toast.error(msg)
      }
    } catch (err: unknown) {
      console.error('Image upload error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMsg)
      toast.error(errorMsg)
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
        toast.success('Product updated successfully')
        onSuccess()
        onClose()
      } else {
        const msg = res.message || 'Failed to update product'
        setError(msg)
        toast.error(msg)
      }
    } catch (err: unknown) {
      console.error('Update product error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      toast.error(errorMsg)
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
          <div className="flex gap-6 items-start">
            {/* Image Preview / Upload */}
            <div 
              className="relative group w-[120px] h-[120px] shrink-0 cursor-pointer pt-[21px]"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-2xl border-2 border-border-main overflow-hidden bg-surface flex items-center justify-center relative shadow-sm transition-all group-hover:border-accent group-hover:shadow-md">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <Package size={36} className="text-muted-text/30" />
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              
              {!isUploading && (
                <div className="absolute top-[21px] left-0 right-0 bottom-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-2xl transition-all backdrop-blur-[2px] z-20">
                  <Upload size={20} className="mb-1" />
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
              <label className="text-[12px] font-bold text-primary-text  tracking-widest flex justify-between items-center pr-1">
                Product Name
                <span className="text-[10px] text-muted-text lowercase font-medium tracking-normal bg-surface px-2 py-0.5 rounded-full border border-border-main/50">
                  {formData.name.length}<span className="opacity-40 mx-0.5">/</span>{VALIDATION_LIMITS.INVENTORY.PRODUCT_NAME_MAX_LENGTH}
                </span>
              </label>
              <textarea
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value.slice(0, VALIDATION_LIMITS.INVENTORY.PRODUCT_NAME_MAX_LENGTH) })}
                maxLength={VALIDATION_LIMITS.INVENTORY.PRODUCT_NAME_MAX_LENGTH}
                className="w-full h-[120px] px-4 py-3 bg-surface border border-border-main rounded-2xl text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all resize-none shadow-sm placeholder:text-muted-text/50"
                placeholder="Enter product name..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text  tracking-wider flex justify-between">
                Unit
                <span className="text-[10px] text-muted-text lowercase font-medium">{formData.unit.length}/{VALIDATION_LIMITS.INVENTORY.PRODUCT_UNIT_MAX_LENGTH}</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value.slice(0, VALIDATION_LIMITS.INVENTORY.PRODUCT_UNIT_MAX_LENGTH) })}
                maxLength={VALIDATION_LIMITS.INVENTORY.PRODUCT_UNIT_MAX_LENGTH}
                className="w-full h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all"
              />
            </div>

            {/* HSN Code Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text  tracking-wider">HSN Code</label>
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
            <label className="text-[12px] font-black text-primary-text  tracking-wider flex items-center justify-between">
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
              <label className="text-[12px] font-black text-primary-text  tracking-wider">CGST (%)</label>
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
              <label className="text-[12px] font-black text-primary-text  tracking-wider">SGST (%)</label>
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
