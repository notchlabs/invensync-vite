import { useState, useEffect, useRef } from 'react'
import { X, Package, Loader2, Plus, Trash2, Info, Upload, Search, ArrowRight, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { InventoryService } from '../../services/inventoryService'
import { HsnSelect } from '../common/HsnSelect'
import { VALIDATION_LIMITS } from '../../config/validation'
import type { InventoryItem } from '../../types/inventory'

interface ExtraCharge {
  id: string
  name: string
  amount: number
  taxable: boolean
}

interface CreateCompositeModalProps {
  isOpen: boolean
  onClose: () => void
  rawItems: InventoryItem[]
  onSuccess: () => void
}

export function CreateCompositeModal({ isOpen, onClose, rawItems, onSuccess }: CreateCompositeModalProps) {
  // Local Style to hide number spinners
  const noSpinnerStyle = `
    .no-spinner::-webkit-outer-spin-button,
    .no-spinner::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .no-spinner {
      -moz-appearance: textfield;
    }
  `;

  // Composite Product State
  const [productName, setProductName] = useState('')
  const [unit, setUnit] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [hsn, setHsn] = useState<{ code: string; name: string; cgst: number; sgst: number } | null>(null)
  
  // Materials State
  const [localItems, setLocalItems] = useState<InventoryItem[]>([])
  const [materials, setMaterials] = useState<Record<string, number>>({})
  
  // Extra Charges State
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])
  
  // UI State
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecipeCollapsed, setIsRecipeCollapsed] = useState(false)
  const [isImageManual, setIsImageManual] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize materials
  useEffect(() => {
    if (isOpen) {
      setLocalItems([...rawItems])
      const initial: Record<string, number> = {}
      rawItems.forEach(item => {
        initial[`${item.productId}-${item.siteId}`] = 1
      })
      setMaterials(initial)
      setProductName('')
      setUnit('')
      setImageUrl('')
      setHsn(null)
      setExtraCharges([])
      setIsImageManual(false)
      setIsSuccess(false)
    }
  }, [isOpen, rawItems])

  // Debounced Product Search
  useEffect(() => {
    if (productName.length < 3 || isImageManual) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await InventoryService.searchProductCache(productName)
        if (res.success && res.data?.imageUrl) {
          setImageUrl(res.data.imageUrl)
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setIsSearching(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [productName, isImageManual])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const res = await InventoryService.uploadAttachment(file)
      if (res.success && res.data?.docUrl) {
        setImageUrl(res.data.docUrl)
        setIsImageManual(true)
      } else {
        toast.error(res.message || 'Image upload failed')
      }
    } catch (err: unknown) {
      console.error('Image upload error:', err)
      const message = err instanceof Error ? err.message : 'Failed to upload image'
      toast.error(message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeItem = (productId: number, siteId: number) => {
    setLocalItems(prev => prev.filter(i => !(i.productId === productId && i.siteId === siteId)))
  }

  const handleQtyChange = (key: string, val: number) => {
    setMaterials(prev => ({ ...prev, [key]: Math.max(0, val) }))
  }

  const addExtraCharge = () => {
    const newCharge: ExtraCharge = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      amount: 0,
      taxable: true
    }
    setExtraCharges([...extraCharges, newCharge])
  }

  const updateExtraCharge = (id: string, updates: Partial<ExtraCharge>) => {
    setExtraCharges(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const removeExtraCharge = (id: string) => {
    setExtraCharges(prev => prev.filter(c => c.id !== id))
  }

  // Calculations
  const rawMaterialTotal = localItems.reduce((acc, item) => {
    const qty = materials[`${item.productId}-${item.siteId}`] || 0
    return acc + (qty * (item.price || 0))
  }, 0)

  const rawMaterialTax = localItems.reduce((acc, item) => {
    const qty = materials[`${item.productId}-${item.siteId}`] || 0
    const cgst = (qty * (item.price || 0) * (item.cgstInPerc || 0)) / 100
    const sgst = (qty * (item.price || 0) * (item.sgstInPerc || 0)) / 100
    return acc + cgst + sgst
  }, 0)

  const chargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  
  const hsnTaxRate = hsn ? (hsn.cgst + hsn.sgst) : 0
  const chargesTax = extraCharges.reduce((acc, c) => {
    if (!c.taxable) return acc
    return acc + ((Number(c.amount) || 0) * hsnTaxRate) / 100
  }, 0)

  const totalBase = rawMaterialTotal + chargesTotal
  const totalTax = rawMaterialTax + chargesTax
  const estimatedCost = totalBase + totalTax

  const handleCreate = () => {
    if (!productName || !unit || !hsn || localItems.length === 0) {
      toast.error('Product Name, Unit, HSN Code, and at least one material are required')
      return
    }

    setIsLoading(true)
    
    interface ChargeDetail { value: number; taxable: boolean }
    const extraChargesMap: Record<string, ChargeDetail> = {}
    extraCharges.forEach((c, idx) => {
      extraChargesMap[String(idx + 1)] = { value: Number(c.amount), taxable: c.taxable }
    })

    const payload = {
      image: imageUrl,
      productName,
      unit,
      hsnCode: hsn.code,
      hsnDescription: hsn.name,
      extraCharges: extraChargesMap,
      cgst: hsn.cgst,
      sgst: hsn.sgst,
      rawMaterials: localItems.map(item => ({
        productId: item.productId,
        siteId: item.siteId,
        quantity: materials[`${item.productId}-${item.siteId}`] || 0,
        unit: item.unit,
        price: item.price,
        cgstInPerc: item.cgstInPerc,
        sgstInPerc: item.sgstInPerc
      }))
    }

    InventoryService.createCompositeProduct(payload)
      .then((res) => {
        if (res.success) {
          toast.success('Final Product created successfully')
          onSuccess()
          setIsSuccess(true)
        } else {
          toast.error(res.systemMessage || res.message || 'Failed to create final product')
        }
      })
      .catch((err: unknown) => {
        console.error('Create product error:', err)
        const typedErr = err as { systemMessage?: string; message?: string }
        toast.error(typedErr.systemMessage || typedErr.message || 'Something went wrong')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleComposeAnother = () => {
    setProductName('')
    setImageUrl('')
    setIsImageManual(false)
    setIsSuccess(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">

      <style>{noSpinnerStyle}</style>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border-main rounded-none sm:rounded-2xl w-full max-w-[1200px] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out] h-screen sm:h-[92dvh] max-h-screen sm:max-h-[92dvh]">
        
        {isSuccess && (
          <div className="absolute inset-0 z-[120] bg-card/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-[bounce_1s_ease-in-out_infinite]">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <Package size={24} />
              </div>
            </div>
            
            <h3 className="text-[24px] font-black text-primary-text  tracking-tight mb-2">Final Product Created!</h3>
            <p className="text-[14px] text-muted-text mb-10 max-w-[320px]">
              Your product has been successfully added to the inventory. How would you like to proceed?
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-[440px]">
              <button 
                onClick={onClose}
                className="w-full h-14 bg-surface border border-border-main text-secondary-text rounded-2xl text-[14px] font-black  tracking-widest hover:text-primary-text hover:bg-header transition-all shadow-sm"
              >
                Close & Finish
              </button>
              <button 
                onClick={handleComposeAnother}
                className="w-full h-14 bg-primary-text text-card rounded-2xl text-[14px] font-black  tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-3"
              >
                Compose Another
                <ArrowRight size={18} />
              </button>
            </div>
            
            <div className="mt-12 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
              <Info size={14} className="text-emerald-500" />
              <span className="text-[11px] font-black  tracking-widest text-emerald-600/70">Composition will be retained for the next build</span>
            </div>
          </div>
        )}

        {/* Low Viewport Advisory */}
        <div className="hidden h-max-[650px]:flex bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 items-center justify-center gap-2 animate-[fadeIn_0.5s_ease-out]">
          <Info size={12} className="text-amber-500" />
          <span className="text-[10px] font-black  tracking-widest text-amber-600/80">Vertical space limited - Desktop mode recommended for best experience</span>
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-header border-b border-border-main flex items-center justify-between">
          <h2 className="text-[18px] sm:text-[20px] font-black text-primary-text tracking-tight ">Create Final Product</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface border border-transparent hover:border-border-main rounded-xl text-muted-text transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col md:flex-row bg-surface/30">
          
          <div className="w-full md:w-[420px] lg:w-[460px] p-5 sm:p-6 border-b md:border-b-0 md:border-r border-border-main flex flex-col gap-4 sm:gap-5 bg-card shrink-0">
            <div className="flex gap-4 items-start">
              {/* Image box aligned to two rows of inputs */}
              <div 
                className="w-24 h-28 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-border-main bg-surface flex items-center justify-center p-2 relative group overflow-hidden shrink-0 cursor-pointer hover:border-accent transition-all"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-text/40 text-center">
                    <Package size={24} className="sm:size-7" />
                    <span className="text-[8px] sm:text-[9px]  font-black leading-tight">Product<br/>Image</span>
                  </div>
                )}
                
                {(isSearching || isUploading) && (
                  <div className="absolute inset-0 bg-card/60 flex items-center justify-center z-10">
                    <Loader2 size={18} className="animate-spin text-accent" />
                  </div>
                )}

                {!isUploading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black rounded-xl transition-all backdrop-blur-[2px] z-20">
                    <Upload size={18} className="mb-1" />
                    UPLOAD
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

              <div className="flex-1 flex flex-col gap-4">
                {/* Product Name Row */}
                <input 
                  type="text"
                  placeholder="Enter Final Product Name..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value.slice(0, VALIDATION_LIMITS.INVENTORY.PRODUCT_NAME_MAX_LENGTH))}
                  className="w-full h-12 px-5 bg-surface border border-border-main rounded-xl text-[14px] font-black text-primary-text outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all shadow-sm placeholder:text-muted-text/30"
                />

                {/* Unit and HSN Code row */}
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text"
                    placeholder="Unit (e.g. Kg, Pcs)"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value.slice(0, VALIDATION_LIMITS.INVENTORY.PRODUCT_UNIT_MAX_LENGTH))}
                    className="w-full h-12 px-5 bg-surface border border-border-main rounded-xl text-[13px] font-bold text-primary-text outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text shadow-sm placeholder:text-muted-text/30"
                  />
                  <HsnSelect 
                    value={hsn ? { code: hsn.code, name: hsn.name } : null}
                    onChange={(data) => setHsn(data)}
                    className="h-12"
                    alignDropdown="right"
                    dropdownWidth="w-[320px]"
                  />
                </div>
              </div>
            </div>

            {/* Read-only reference fields */}
            <div className="flex flex-col justify-center p-4 bg-header/20 border border-border-main border-dashed rounded-xl min-h-[110px]">
              {hsn ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-muted-text  tracking-widest">HSN Description</label>
                    <div className="text-[12px] font-medium text-secondary-text leading-snug line-clamp-2 overflow-hidden">
                      {hsn.name}
                    </div>
                  </div>
                  
                  <div className="pt-2 mt-2 border-t border-border-main/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-text  tracking-widest">CGST</span>
                        <span className="text-[13px] font-black text-primary-text">{hsn.cgst}%</span>
                      </div>
                      <div className="w-px h-6 bg-border-main/50" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-text  tracking-widest">SGST</span>
                        <span className="text-[13px] font-black text-primary-text">{hsn.sgst}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-muted-text  tracking-widest">Total Tax</span>
                      <span className="text-[13px] font-black text-emerald-500">{hsn.cgst + hsn.sgst}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-2 animate-[fadeIn_0.3s_ease-out]">
                  <Search size={24} className="text-muted-text/40 mb-2" />
                  <p className="text-[12px] font-bold text-muted-text max-w-[280px] leading-relaxed">
                    Select an HSN from above to view tax particulars and descriptions here.
                  </p>
                </div>
              )}
            </div>

            {/* Extra Charges - Moved to Left Column */}
            <div className="p-4 sm:p-5 bg-header/40 border border-border-main rounded-2xl border-dashed">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex flex-col">
                  <h4 className="text-[13px] font-black text-primary-text  tracking-wide">Extra Charges</h4>
                  <p className="text-[10px] text-muted-text">Shipping, packing, etc.</p>
                  {(hsn?.cgst || 0) + (hsn?.sgst || 0) > 0 && (
                    <p className="text-[9px] font-bold text-accent mt-1 animate-[fadeIn_0.3s_ease-out]">
                      Note: Taxable charges will incur {(hsn?.cgst || 0) + (hsn?.sgst || 0)}% GST based on the HSN above.
                    </p>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={addExtraCharge}
                  className="px-3 py-1.5 bg-card border border-border-main rounded-xl text-[10px] font-black  text-primary-text hover:bg-surface transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={12} className="group-hover:rotate-90 transition-transform" /> Add
                </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {extraCharges.map(c => (
                  <div key={c.id} className="flex flex-col gap-2 p-3 bg-card rounded-xl border border-border-main">
                    <input 
                      placeholder="Name (e.g. TCS)"
                      value={c.name}
                      onChange={(e) => updateExtraCharge(c.id, { name: e.target.value })}
                      className="w-full h-9 px-3 bg-surface border border-border-main rounded-lg text-[11px] font-bold text-primary-text outline-none focus:border-secondary-text"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text text-[11px] font-bold">₹</span>
                        <input 
                          type="number"
                          placeholder="0"
                          value={c.amount || ''}
                          onChange={(e) => updateExtraCharge(c.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full h-9 pl-6 pr-2 bg-surface border border-border-main rounded-lg text-[11px] font-black text-primary-text outline-none no-spinner"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => updateExtraCharge(c.id, { taxable: !c.taxable })}
                        className={`flex items-center gap-1.5 px-2 h-9 border rounded-lg transition-all ${
                          c.taxable ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-surface border-border-main text-muted-text'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${c.taxable ? 'bg-emerald-500 border-emerald-500' : 'border-muted-text/30'}`}>
                          {c.taxable && <div className="w-1.5 h-1.5 rounded-px bg-white" />}
                        </div>
                        <span className="text-[9px] font-black  tracking-wider">Tax</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeExtraCharge(c.id)} 
                        className="w-9 h-9 flex items-center justify-center text-muted-text hover:text-red-500 bg-surface border border-border-main rounded-lg hover:border-red-500/20 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {extraCharges.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-muted-text/30 font-bold  tracking-widest border border-dashed border-border-main/50 rounded-xl">
                    None added
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Recipe & Costing */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col gap-6 overflow-x-hidden min-h-[400px]">
            <div className="bg-surface/30 border border-border-main rounded-2xl overflow-hidden flex flex-col">
              <div 
                className="sticky top-0 z-20 flex items-center justify-between p-4 bg-card/95 backdrop-blur-sm border-b border-border-main/50 cursor-pointer transition-all hover:bg-header/60 group/header select-none"
                onClick={() => setIsRecipeCollapsed(!isRecipeCollapsed)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] sm:text-[15px] font-black text-primary-text tracking-tight ">Recipe / <span className="text-secondary-text">BOQ</span></h3>
                    <div className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-sm">
                      {localItems.length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isRecipeCollapsed && (
                    <span className="text-[12px] font-black text-emerald-500 tracking-tighter animate-[fadeIn_0.2s_ease-out]">₹{rawMaterialTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  )}
                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg border border-border-main bg-card text-muted-text transition-all ${isRecipeCollapsed ? 'rotate-0' : 'rotate-180'} group-hover/header:text-primary-text`}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              
              {!isRecipeCollapsed && (
                <div className="p-4 pt-2 flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
                  <p className="text-[10px] sm:text-[11px] text-muted-text leading-relaxed opacity-60  font-bold tracking-wider">
                    Structure of raw materials required to produce 1 unit of this product.
                  </p>
                  <div className="flex flex-col max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {localItems.map((item) => {
                      const key = `${item.productId}-${item.siteId}`
                      return (
                        <div key={key} className="py-3 border-b last:border-0 border-border-main/40 flex items-center gap-3 group transition-all relative hover:bg-surface/30 px-2 -mx-2 rounded-lg">
                          <div className="w-11 h-11 rounded-lg border border-border-main bg-surface overflow-hidden p-1 flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="text-muted-text/30" size={18} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] sm:text-[13px] font-black text-primary-text  tracking-tight truncate pr-8 lg:pr-0">{item.productName}</div>
                            <div className="text-[10px] text-muted-text font-medium mt-0.5 line-clamp-1">{item.vendorNames || 'Generic'}</div>
                          </div>
                          
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-black text-muted-text  tracking-widest opacity-60">Qty</span>
                              <input 
                                type="number"
                                value={materials[key] || 0}
                                onChange={(e) => handleQtyChange(key, parseFloat(e.target.value))}
                                className="w-14 sm:w-16 h-8 text-center bg-surface border border-border-main rounded-lg text-[12px] font-black text-primary-text outline-none focus:border-accent no-spinner"
                              />
                            </div>
                            <div className="flex flex-col items-end shrink-0 min-w-[70px]">
                              <span className="text-[9px] font-black text-muted-text  tracking-widest opacity-60">Price</span>
                              <div className="text-[13px] sm:text-[15px] font-black text-primary-text tracking-tighter">₹{(item.price * (materials[key] || 0)).toLocaleString()}</div>
                            </div>
                            
                            <button 
                              onClick={() => removeItem(item.productId, item.siteId)}
                              className="w-8 h-8 flex items-center justify-center text-muted-text hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all border border-transparent hover:border-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-header border-t border-border-main flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 relative">
          <div className="flex items-center gap-5 sm:gap-8 w-full sm:w-auto">
            {/* Persistent Price Info */}
            <div className="flex flex-col gap-0.5 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-black  tracking-[0.2em] text-muted-text/60 leading-none">Estimated Cost</span>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-[24px] sm:text-[32px] font-black tracking-tighter text-emerald-500 leading-none">₹{estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[11px] sm:text-[13px] font-bold text-muted-text/50 whitespace-nowrap">
                  + ₹{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="hidden sm:inline">(tax)</span>
                </span>
              </div>
            </div>

            </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto shrink-0">
            <button onClick={onClose} className="flex-1 sm:flex-none px-8 h-12 text-[13px] font-black  tracking-widest text-secondary-text hover:text-primary-text hover:bg-surface rounded-xl transition-all">
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={isLoading || !productName || !hsn}
              className="flex-[2] sm:flex-none px-10 h-12 bg-primary-text text-card text-[13px] font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100  tracking-widest cursor-pointer whitespace-nowrap group/create sm:min-w-[240px]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Create Final Product</span>
                  <span className="sm:hidden">Create</span>
                  <ArrowRight size={18} className="group-hover/create:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
