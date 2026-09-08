import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ScanBarcode, Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

interface CameraDevice {
  id: string
  label: string
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const html5QrCodeRef = useRef<any>(null)
  const isStoppingRef = useRef(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualBarcode, setManualBarcode] = useState('')
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.warn('Error stopping scanner:', err)
      } finally {
        html5QrCodeRef.current = null
        isStoppingRef.current = false
      }
    }
  }, [])

  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    setIsStarting(true)
    setError(null)
    await stopScanner()

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Check for available cameras
      let cameras: CameraDevice[] = []
      try {
        cameras = await Html5Qrcode.getCameras()
        setAvailableCameras(cameras)
      } catch (camErr) {
        console.warn('Camera enumeration error:', camErr)
      }

      // Determine camera target
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

      const scannerContainerId = 'barcode-scanner-viewport'
      const containerEl = document.getElementById(scannerContainerId)
      if (!containerEl) {
        throw new Error('Scanner viewport element not ready')
      }

      const scanner = new Html5Qrcode(scannerContainerId)
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
          onScan(decodedText)
          stopScanner().catch(() => {})
          onClose()
        },
        () => {}
      )
    } catch (err: any) {
      console.error('Barcode scanner start error:', err)
      setError(
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : 'Could not access camera. Please enter barcode number below.'
      )
    } finally {
      setIsStarting(false)
    }
  }, [onScan, onClose, stopScanner])

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      setManualBarcode('')
      setError(null)
      // Small timeout to allow DOM element to mount
      const timer = setTimeout(() => {
        startScanner()
      }, 100)
      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    } else {
      stopScanner()
    }
  }, [isOpen, startScanner, stopScanner])

  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return
    const currentIndex = availableCameras.findIndex(c => c.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCam = availableCameras[nextIndex]
    startScanner(nextCam.id)
  }

  if (!isOpen) return null

  const handleManualSubmit = () => {
    const trimmed = manualBarcode.trim()
    if (trimmed) {
      onScan(trimmed)
      stopScanner().catch(() => {})
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-[420px] overflow-hidden flex flex-col animate-[fadeInUp_0.25s_ease-out]">

        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between bg-header border-b border-border-main shrink-0">
          <h2 className="text-[17px] font-black text-primary-text tracking-tight flex items-center gap-2.5">
            <ScanBarcode className="text-emerald-500" size={20} />
            Scan Barcode
          </h2>
          <div className="flex items-center gap-1">
            {availableCameras.length > 1 && (
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
              className="p-1.5 hover:bg-surface border border-transparent hover:border-border-main rounded-lg text-muted-text hover:text-primary-text transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scanner Viewport */}
        <div className="p-5 pb-3">
          <div className="w-full rounded-xl overflow-hidden bg-black/90 border border-border-main relative min-h-[230px] aspect-[4/3] flex items-center justify-center">
            {/* The video container managed by Html5Qrcode */}
            <div
              id="barcode-scanner-viewport"
              className="w-full h-full min-h-[230px] [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-xl"
            />

            {/* Spinner Overlay */}
            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 gap-2 text-white/70 pointer-events-none z-10">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
                <span className="text-[12px] font-medium">Starting camera...</span>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90 gap-3 z-10">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle size={20} />
                </div>
                <p className="text-[12px] text-secondary-text leading-relaxed max-w-[280px]">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface border border-border-main text-primary-text text-[12px] font-bold hover:bg-surface/80 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw size={13} /> Retry Camera
                </button>
              </div>
            )}

            {/* Reticle Guide Overlay */}
            {!isStarting && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] h-[55%] border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/70 shadow-[0_0_8px_#10b981] animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="px-5 flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border-main" />
          <span className="text-[11px] font-bold text-muted-text tracking-wider uppercase">or enter manually</span>
          <div className="flex-1 h-px bg-border-main" />
        </div>

        {/* Manual Input */}
        <div className="p-5 pt-2 flex gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Enter barcode number..."
            className="flex-1 h-[42px] px-3.5 bg-surface border border-border-main rounded-xl text-[13px] font-mono text-primary-text focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-muted-text/50"
            autoFocus={!!error}
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualBarcode.trim()}
            className="px-5 h-[42px] bg-primary-text text-card text-[13px] font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

