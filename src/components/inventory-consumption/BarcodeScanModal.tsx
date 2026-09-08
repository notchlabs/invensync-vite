import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X,
  ScanBarcode,
  Loader2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ShoppingBag,
  RefreshCw,
  Package,
  ArrowRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { InventoryService } from '../../services/inventoryService'
import type { InventoryItem } from '../../types/inventory'
import type { CartEntry } from './types'

interface FoundProductInfo {
  productId: number
  productName: string
  unit: string
  price: number
  mrp: number
  imageUrl: string | null
  cgstInPerc: number
  sgstInPerc: number
  barcode?: string
  availableQty?: number
}

interface BarcodeScanModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (entry: CartEntry) => void
  onAddAndOpenConsumption?: (entry: CartEntry) => void
  invItems: InventoryItem[]
}

type ScanStatus = 'scanning' | 'searching' | 'found' | 'not_found'

export function BarcodeScanModal({
  isOpen,
  onClose,
  onAddProduct,
  onAddAndOpenConsumption,
  invItems,
}: BarcodeScanModalProps) {
  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [foundProduct, setFoundProduct] = useState<FoundProductInfo | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

  const html5QrCodeRef = useRef<any>(null)
  const isStoppingRef = useRef(false)

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch {
        // ignore stop errors
      } finally {
        html5QrCodeRef.current = null
        isStoppingRef.current = false
      }
    }
  }, [])

  const handleLookup = useCallback(async (rawBarcode: string) => {
    const barcode = rawBarcode.trim()
    if (!barcode) return

    await stopCamera()
    setScannedBarcode(barcode)
    setStatus('searching')
    setFoundProduct(null)
    setQuantity(1)

    // 1. Try finding in loaded inventory items first
    const matchedInvItem = invItems.find(
      i => i.barcode === barcode || String(i.barcode) === barcode
    )

    if (matchedInvItem) {
      const costPrice = matchedInvItem.price != null && matchedInvItem.price > 0 ? matchedInvItem.price : matchedInvItem.mrp
      const mrp = matchedInvItem.mrp || costPrice
      setFoundProduct({
        productId: matchedInvItem.productId,
        productName: matchedInvItem.productName,
        unit: matchedInvItem.unit,
        price: costPrice,
        mrp: mrp,
        imageUrl: matchedInvItem.imageUrl,
        cgstInPerc: matchedInvItem.cgstInPerc || 0,
        sgstInPerc: matchedInvItem.sgstInPerc || 0,
        barcode: matchedInvItem.barcode || barcode,
        availableQty: matchedInvItem.quantity,
      })
      setStatus('found')
      return
    }

    // 2. Query backend by barcode
    try {
      const res = await InventoryService.searchByBarcode(barcode)
      if (res.success && res.data) {
        const prod = res.data
        // Cross reference with invItems for stock qty if available
        const local = invItems.find(i => i.productId === prod.id)
        const costPrice = prod.price || local?.price || 0
        const mrp = prod.price || local?.mrp || costPrice

        setFoundProduct({
          productId: prod.id,
          productName: prod.name,
          unit: prod.unit || 'Pcs',
          price: costPrice,
          mrp: mrp,
          imageUrl: prod.imageUrl || local?.imageUrl || null,
          cgstInPerc: prod.cgstInPerc || 0,
          sgstInPerc: prod.sgstInPerc || 0,
          barcode: prod.barcode || barcode,
          availableQty: local?.quantity,
        })
        setStatus('found')
        return
      }
    } catch (e) {
      console.warn('Backend barcode lookup error:', e)
    }

    // Not found
    setStatus('not_found')
  }, [invItems, stopCamera])

  // Camera initialization
  const startCamera = useCallback(async (cameraIdToUse?: string) => {
    if (!isOpen || status !== 'scanning') return

    setIsCameraStarting(true)
    setCameraError(null)
    await stopCamera()

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      let cameras: Array<{ id: string; label: string }> = []
      try {
        cameras = await Html5Qrcode.getCameras()
        setAvailableCameras(cameras)
      } catch (camErr) {
        console.warn('Camera enumeration error:', camErr)
      }

      let targetCamera: any = { facingMode: 'environment' }
      if (cameraIdToUse) {
        targetCamera = cameraIdToUse
        setSelectedCameraId(cameraIdToUse)
      } else if (cameras.length > 0) {
        const rearCam = cameras.find(c => /back|rear|environment/i.test(c.label))
        const preferred = rearCam || cameras[0]
        targetCamera = preferred.id
        setSelectedCameraId(preferred.id)
      }

      const scannerId = 'consumption-barcode-reader-viewport'
      const el = document.getElementById(scannerId)
      if (!el) {
        throw new Error('Camera container not mounted')
      }

      const scanner = new Html5Qrcode(scannerId)
      html5QrCodeRef.current = scanner

      await scanner.start(
        targetCamera,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            const size = Math.floor(minEdge * 0.75)
            return {
              width: Math.max(160, Math.floor(size * 1.3)),
              height: Math.max(100, Math.floor(size * 0.8)),
            }
          },
        },
        (decodedText: string) => {
          handleLookup(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      console.warn('Barcode camera start error:', err)
      setCameraError(
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Camera access denied. Please grant camera permissions in your browser.'
          : err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : 'Could not access camera. You can enter the barcode manually below.'
      )
    } finally {
      setIsCameraStarting(false)
    }
  }, [isOpen, status, handleLookup, stopCamera])

  useEffect(() => {
    if (isOpen && status === 'scanning') {
      const t = setTimeout(() => {
        startCamera()
      }, 100)
      return () => {
        clearTimeout(t)
        stopCamera()
      }
    } else {
      stopCamera()
    }
  }, [isOpen, status, startCamera, stopCamera])

  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return
    const curIdx = availableCameras.findIndex(c => c.id === selectedCameraId)
    const nextCam = availableCameras[(curIdx + 1) % availableCameras.length]
    startCamera(nextCam.id)
  }

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStatus('scanning')
      setScannedBarcode('')
      setManualInput('')
      setFoundProduct(null)
      setQuantity(1)
      setCameraError(null)
    } else {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  if (!isOpen) return null

  const handleRestartScan = () => {
    setScannedBarcode('')
    setFoundProduct(null)
    setQuantity(1)
    setStatus('scanning')
  }

  const handleAddToCart = (openConsumption: boolean = false) => {
    if (!foundProduct) return

    const entry: CartEntry = {
      productId: foundProduct.productId,
      productName: foundProduct.productName,
      unit: foundProduct.unit,
      price: foundProduct.price,
      mrp: foundProduct.mrp,
      imageUrl: foundProduct.imageUrl,
      source: 'inventory',
      qty: quantity,
      cgstInPerc: foundProduct.cgstInPerc,
      sgstInPerc: foundProduct.sgstInPerc,
    }

    if (openConsumption && onAddAndOpenConsumption) {
      onAddAndOpenConsumption(entry)
    } else {
      onAddProduct(entry)
    }

    toast.success(`Added ${quantity}x ${foundProduct.productName} to consumption!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-[480px] overflow-hidden flex flex-col animate-[fadeInUp_0.25s_ease-out] max-h-[92vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border-main flex items-center justify-between bg-header shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ScanBarcode size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-primary-text tracking-tight leading-tight">
                Scan Product Barcode
              </h2>
              <p className="text-[11px] text-muted-text font-medium">
                {status === 'found'
                  ? 'Set quantity to consume'
                  : 'Scan barcode or enter number manually'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {status === 'scanning' && availableCameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="p-1.5 hover:bg-surface border border-border-main rounded-lg text-secondary-text hover:text-primary-text transition-all cursor-pointer mr-1"
                title="Switch Camera"
              >
                <RefreshCw size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-text hover:text-primary-text hover:bg-surface transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">

          {/* ── Status: SCANNING ────────────────────────────────────── */}
          {status === 'scanning' && (
            <div className="flex flex-col gap-4">
              {/* Camera Frame */}
              <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-[16/10] flex items-center justify-center border border-border-main shadow-inner min-h-[220px]">
                <div
                  id="consumption-barcode-reader-viewport"
                  className="w-full h-full min-h-[220px] [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-xl"
                />

                {isCameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 text-muted-text pointer-events-none z-10">
                    <Loader2 size={24} className="animate-spin text-accent" />
                    <span className="text-[12px] font-medium">Starting camera...</span>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 gap-2 z-10">
                    <Camera size={26} className="text-muted-text/50" />
                    <p className="text-[12px] text-secondary-text leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId)}
                      className="mt-1 px-3 py-1 rounded-lg bg-surface border border-border-main text-primary-text text-[11px] font-bold hover:bg-surface/80 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw size={12} /> Retry Camera
                    </button>
                  </div>
                )}

                {/* Target overlay overlay box when camera is running */}
                {!cameraError && !isCameraStarting && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[70%] h-[60%] border-2 border-accent/80 rounded-xl relative shadow-[0_0_15px_rgba(234,179,8,0.25)]">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-accent/70 shadow-[0_0_8px_#eab308] animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Input Fallback */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[11px] font-black text-secondary-text tracking-wider uppercase">
                  Or enter barcode manually
                </label>
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    if (manualInput.trim()) handleLookup(manualInput.trim())
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <ScanBarcode size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input
                      type="text"
                      placeholder="e.g. 8901234567890"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      className="w-full h-[40px] pl-9 pr-3 bg-surface border border-border-main rounded-xl text-[13px] font-mono text-primary-text outline-none focus:border-secondary-text transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="h-[40px] px-4 bg-primary-text text-card rounded-xl text-[12px] font-bold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Lookup
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Status: SEARCHING ───────────────────────────────────── */}
          {status === 'searching' && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 size={32} className="animate-spin text-accent" />
              <div>
                <p className="text-[14px] font-bold text-primary-text">Finding product...</p>
                <p className="text-[12px] text-muted-text font-mono mt-0.5">Barcode: {scannedBarcode}</p>
              </div>
            </div>
          )}

          {/* ── Status: FOUND ───────────────────────────────────────── */}
          {status === 'found' && foundProduct && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Product Match Banner */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 text-[12px] font-bold">
                  <CheckCircle2 size={14} />
                  Product Found
                </div>
                <button
                  type="button"
                  onClick={handleRestartScan}
                  className="text-[11px] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} /> Scan Another
                </button>
              </div>

              {/* Product Card Details */}
              <div className="p-3.5 bg-surface/50 border border-border-main rounded-xl flex gap-3.5 items-start">
                <div className="w-16 h-16 rounded-xl bg-surface border border-border-main overflow-hidden shrink-0 flex items-center justify-center">
                  {foundProduct.imageUrl ? (
                    <img
                      src={foundProduct.imageUrl}
                      alt={foundProduct.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={24} className="text-muted-text/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3 className="text-[14px] font-black text-primary-text leading-snug line-clamp-2">
                    {foundProduct.productName}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-bold text-accent">
                      ₹{foundProduct.mrp.toFixed(2)}
                    </span>
                    <span className="text-muted-text">•</span>
                    <span className="text-secondary-text font-medium">{foundProduct.unit}</span>
                    {foundProduct.availableQty !== undefined && (
                      <>
                        <span className="text-muted-text">•</span>
                        <span
                          className={`font-semibold ${
                            foundProduct.availableQty > 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {foundProduct.availableQty > 0
                            ? `Stock: ${foundProduct.availableQty}`
                            : 'Out of Stock'}
                        </span>
                      </>
                    )}
                  </div>
                  {foundProduct.barcode && (
                    <p className="text-[10px] text-muted-text font-mono truncate">
                      Barcode: {foundProduct.barcode}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Selector Section */}
              <div className="bg-surface/30 border border-border-main/70 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black text-primary-text tracking-wider">
                    Quantity to Add
                  </label>
                  <div className="text-[12px] font-mono font-bold text-primary-text">
                    Total: ₹{(foundProduct.mrp * quantity).toFixed(2)}
                  </div>
                </div>

                {/* Big Counter */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-11 rounded-xl bg-card border border-border-main hover:bg-surface active:scale-95 flex items-center justify-center text-primary-text font-bold transition-all disabled:opacity-30 cursor-pointer shadow-sm"
                  >
                    <Minus size={18} />
                  </button>

                  <div className="w-24 text-center">
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        setQuantity(isNaN(val) || val < 1 ? 1 : val)
                      }}
                      className="w-full text-center text-[24px] font-black text-primary-text bg-transparent outline-none font-mono"
                    />
                    <span className="text-[11px] text-muted-text uppercase font-semibold">
                      {foundProduct.unit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 rounded-xl bg-card border border-border-main hover:bg-surface active:scale-95 flex items-center justify-center text-primary-text font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Quick Add Pills */}
                <div className="flex items-center justify-center gap-2 pt-1 border-t border-border-main/40">
                  <span className="text-[10px] text-muted-text font-medium mr-1">Quick:</span>
                  {[1, 2, 5, 10].map(addVal => (
                    <button
                      key={addVal}
                      type="button"
                      onClick={() => setQuantity(addVal)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        quantity === addVal
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border-main text-secondary-text hover:text-primary-text'
                      }`}
                    >
                      {addVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Status: NOT_FOUND ───────────────────────────────────── */}
          {status === 'not_found' && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-primary-text">No Product Found</h3>
                <p className="text-[12px] text-muted-text mt-1 max-w-[320px]">
                  No item in inventory has barcode{' '}
                  <span className="font-mono font-bold text-secondary-text">{scannedBarcode}</span>.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleRestartScan}
                  className="px-4 py-2 bg-primary-text text-card rounded-xl text-[12px] font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer"
                >
                  <RefreshCw size={13} /> Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-surface border border-border-main text-secondary-text rounded-xl text-[12px] font-bold hover:text-primary-text transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {status === 'found' && foundProduct && (
          <div className="p-4 bg-header border-t border-border-main flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRestartScan}
              className="px-3.5 py-2.5 text-[12px] font-bold text-secondary-text hover:text-primary-text border border-border-main rounded-xl transition-all cursor-pointer"
            >
              Scan Another
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                className="px-4 py-2.5 bg-primary-text text-card text-[12px] font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              >
                <ShoppingBag size={14} />
                Add ({quantity})
              </button>

              {onAddAndOpenConsumption && (
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  className="px-4 py-2.5 bg-accent text-card text-[12px] font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                >
                  Add & Open Modal
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
