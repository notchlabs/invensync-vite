import { useState, useEffect, useRef } from 'react'
import { X, Upload, Package, Edit3, ShieldCheck, Tag, Loader2, ScanBarcode, Plus, IndianRupee, Layers, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { HsnSelect } from '../common/HsnSelect'
import { BarcodeScanner } from '../common/BarcodeScanner'
import { InventoryService } from '../../services/inventoryService'
import { VALIDATION_LIMITS } from '../../config/validation'
import type { InventoryItem, ProductCategory } from '../../types/inventory'

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
    imageUrl: '',
    barcode: '',
    categoryId: null as number | null,
    price: null as number | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImageManual, setIsImageManual] = useState(false)
  const [isSearchingImage, setIsSearchingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Category state
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Barcode scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Accordion state
  const [isHsnOpen, setIsHsnOpen] = useState(false)

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        name: item.productName || '',
        unit: item.unit || 'Pcs',
        hsnCode: String(item.hsnCode || ''),
        hsnName: item.hsnName || '',
        cgstInPerc: item.cgstInPerc || 0,
        sgstInPerc: item.sgstInPerc || 0,
        imageUrl: item.imageUrl || '',
        barcode: (item as any).barcode || '',
        categoryId: (item as any).categoryId || null,
        price: item.price || null,
      })
      setIsImageManual(false)
      setShowNewCategory(false)
      setNewCategoryName('')
      setIsHsnOpen(false)

      // Fetch categories
      fetchCategories()

      // Fetch fresh product details from backend
      fetchProductDetails(item.productId)
    }
  }, [item, isOpen])

  const fetchProductDetails = async (productId: number) => {
    try {
      const res = await InventoryService.getProduct(productId)
      if (res.success && res.data) {
        const prod = res.data
        setFormData(prev => ({
          ...prev,
          name: prod.name || prev.name,
          unit: prod.unit || prev.unit,
          hsnCode: prod.hsnCode ? String(prod.hsnCode) : prev.hsnCode,
          hsnName: prod.hsnName || prev.hsnName,
          cgstInPerc: prod.cgstInPerc ?? prev.cgstInPerc,
          sgstInPerc: prod.sgstInPerc ?? prev.sgstInPerc,
          imageUrl: prod.imageUrl || prev.imageUrl,
          barcode: prod.barcode ?? prev.barcode,
          categoryId: prod.categoryId !== undefined ? prod.categoryId : prev.categoryId,
          price: prod.price !== undefined && prod.price !== null ? prod.price : prev.price,
        }))
      }
    } catch { /* silent fallback to item */ }
  }

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const res = await InventoryService.fetchCategories()
      if (res.success && res.data) {
        setCategories(res.data)
      }
    } catch { /* silent */ }
    finally { setIsLoadingCategories(false) }
  }


  // Debounced product cache image lookup on name change
  useEffect(() => {
    if (formData.name.length < 3 || isImageManual) return
    const t = setTimeout(async () => {
      setIsSearchingImage(true)
      try {
        const res = await InventoryService.searchProductCache(formData.name)
        if (res.success && res.data?.imageUrl) {
          setFormData(prev => ({ ...prev, imageUrl: res.data.imageUrl }))
        }
      } catch { /* silent */ }
      finally { setIsSearchingImage(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [formData.name, isImageManual])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const res = await InventoryService.uploadAttachment(file)
      if (res.success && res.data?.docUrl) {
        setIsImageManual(true)
        setFormData(prev => ({ ...prev, imageUrl: res.data.docUrl }))
      } else {
        const msg = res.message || 'Image upload failed'
        toast.error(msg)
      }
    } catch (err: unknown) {
      console.error('Image upload error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image'
      toast.error(errorMsg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsCreatingCategory(true)
    try {
      const res = await InventoryService.createCategory(newCategoryName.trim())
      if (res.success && res.data) {
        setCategories(prev => [...prev, res.data])
        setFormData(prev => ({ ...prev, categoryId: res.data.id }))
        setNewCategoryName('')
        setShowNewCategory(false)
        toast.success('Category created!')
      } else {
        toast.error(res.message || 'Failed to create category')
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create category'
      toast.error(errorMsg)
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleUpdate = async () => {
    if (!item) return
    setIsLoading(true)

    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        hsnCode: parseInt(formData.hsnCode),
        hsnName: formData.hsnName,
        imageUrl: formData.imageUrl,
        cgstInPerc: formData.cgstInPerc,
        sgstInPerc: formData.sgstInPerc,
        barcode: formData.barcode || undefined,
        categoryId: formData.categoryId,
        price: formData.price,
      }

      const res = await InventoryService.updateProduct(item.productId, payload)
      if (res.success) {
        toast.success('Product updated successfully')
        // Update item in place so reopening immediately retains the updated data
        if (item) {
          item.productName = formData.name
          item.unit = formData.unit
          item.hsnCode = parseInt(formData.hsnCode) || item.hsnCode
          item.hsnName = formData.hsnName
          item.cgstInPerc = formData.cgstInPerc
          item.sgstInPerc = formData.sgstInPerc
          item.imageUrl = formData.imageUrl
          item.barcode = formData.barcode || null
          item.categoryId = formData.categoryId
          if (formData.price != null) item.price = formData.price
        }
        onSuccess()
        onClose()
      } else {
        const msg = res.message || 'Failed to update product'
        toast.error(msg)
      }
    } catch (err: unknown) {
      console.error('Update product error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
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
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between shrink-0">
          <h2 className="text-[20px] font-black text-primary-text tracking-tight flex items-center gap-2.5">
            <Edit3 className="text-primary-text" size={22} />
            Edit Product
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface border border-transparent hover:border-border-main rounded-lg text-muted-text transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="px-6 py-2 pb-16 overflow-y-auto custom-scrollbar flex flex-col gap-5 flex-1">
          
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
                
                {(isUploading || isSearchingImage) && (
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

          {/* Barcode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black text-primary-text tracking-wider flex items-center gap-1.5">
              <ScanBarcode size={13} className="text-muted-text" />
              Barcode
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-mono font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all placeholder:text-muted-text/50"
                  placeholder="Enter or scan barcode..."
                />
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="h-[42px] px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <ScanBarcode size={16} />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black text-primary-text tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-muted-text" />
              Category
            </label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <select
                  value={formData.categoryId ?? ''}
                  onChange={e => {
                    const val = e.target.value
                    setFormData({ ...formData, categoryId: val ? Number(val) : null })
                  }}
                  className="flex-1 h-[42px] px-3 bg-surface border border-border-main rounded-lg text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all cursor-pointer appearance-none"
                >
                  <option value="">— No Category —</option>
                  {isLoadingCategories ? (
                    <option disabled>Loading...</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="h-[42px] px-3.5 bg-surface hover:bg-surface/80 border border-border-main rounded-lg text-muted-text hover:text-primary-text font-bold text-[12px] flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title="Add new category"
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                  placeholder="Category name..."
                  className="flex-1 h-[42px] px-3.5 bg-surface border border-emerald-500/30 rounded-lg text-[13px] font-medium text-primary-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-muted-text/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isCreatingCategory}
                  className="h-[42px] px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  {isCreatingCategory ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                  className="h-[42px] px-3 bg-surface hover:bg-surface/80 border border-border-main rounded-lg text-muted-text transition-all cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Price & Unit Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Selling Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text tracking-wider flex items-center gap-1.5">
                <IndianRupee size={13} className="text-muted-text" />
                Selling Price
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text text-[13px] font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price ?? ''}
                  onChange={e => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full h-[42px] pl-8 pr-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all placeholder:text-muted-text/50"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-primary-text tracking-wider flex justify-between">
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
          </div>

          {/* HSN & Tax Details (Collapsible Accordion) */}
          <div className={`border border-border-main rounded-xl bg-surface/30 transition-all ${isHsnOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
            <button
              type="button"
              onClick={() => setIsHsnOpen(!isHsnOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck size={15} className="text-secondary-text" />
                <span className="text-[12px] font-black text-primary-text tracking-wider">
                  HSN & Tax Details
                </span>
                {formData.hsnCode && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold">
                    HSN: {formData.hsnCode}
                  </span>
                )}
                {(formData.cgstInPerc > 0 || formData.sgstInPerc > 0) && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold">
                    GST: {formData.cgstInPerc + formData.sgstInPerc}%
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-text transition-transform duration-200 shrink-0 ${
                  isHsnOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isHsnOpen && (
              <div className="p-4 pt-2 border-t border-border-main/50 flex flex-col gap-3.5 animate-[fadeIn_0.15s_ease-out]">
                {/* HSN Code Search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-primary-text tracking-wider">HSN Code</label>
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

                {/* HSN Name / Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-primary-text tracking-wider flex items-center justify-between">
                    HSN Description
                    <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded opacity-80">Auto-filled</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.hsnName}
                      onChange={e => setFormData({ ...formData, hsnName: e.target.value })}
                      className="w-full h-[70px] px-3.5 py-2.5 bg-surface border border-border-main rounded-xl text-[12px] text-secondary-text focus:outline-none focus:ring-2 focus:ring-accent/10 transition-all italic leading-relaxed"
                      placeholder="HSN description..."
                    />
                    <ShieldCheck size={14} className="absolute bottom-2 right-2 text-emerald-500 opacity-50" />
                  </div>
                </div>

                {/* Tax Rates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-primary-text tracking-wider">CGST (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.cgstInPerc}
                        onChange={e => setFormData({ ...formData, cgstInPerc: parseFloat(e.target.value) || 0 })}
                        className="w-full h-[38px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10"
                      />
                      <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-primary-text tracking-wider">SGST (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.sgstInPerc}
                        onChange={e => setFormData({ ...formData, sgstInPerc: parseFloat(e.target.value) || 0 })}
                        className="w-full h-[38px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10"
                      />
                      <Tag size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-header border-t border-border-main flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[13px] font-bold text-secondary-text hover:text-primary-text border border-border-main rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-8 py-2.5 bg-primary-text text-card text-[13px] font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Product'}
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => {
          setFormData(prev => ({ ...prev, barcode }))
          toast.success(`Barcode scanned: ${barcode}`)
        }}
      />
    </div>
  )
}
