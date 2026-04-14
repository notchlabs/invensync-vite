import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Upload, X, Check, FileText, Loader2, Play, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { StockUploadService, type PendingBatch, type ExtractedExtractionData } from '../../services/stockUploadService';
import { ConfirmStockModal } from './ConfirmStockModal';
import { InboundModal } from './InboundModal';
import toast from 'react-hot-toast';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export type FileStatus = 'READY' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'DUPLICATE';

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileStatus;
  message?: string;
  ext?: string;
  extractedData?: ExtractedExtractionData;
}

export const UploadArea = ({ 
  refreshRecent 
}: { 
  refreshRecent: () => void 
}) => {
  const [singleInvoiceMode, setSingleInvoiceMode] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([]);

  useEffect(() => {
    fetchPending();
  }, [showInboundModal, showConfirmModal]);

  const fetchPending = async () => {
    try {
      const res = await StockUploadService.fetchPendingBatches();
      if (res && res.data) {
        setPendingBatches(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const splitPdfIntoImages = async (file: File): Promise<File[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const extractedFiles: File[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (blob) {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const newFileName = `${baseName} (Page ${i}).jpg`;
        const newFile = new File([blob], newFileName, { type: 'image/jpeg' });
        extractedFiles.push(newFile);
      }
    }
    return extractedFiles;
  };

  const processIncomingFile = useCallback(async (file: File) => {
    if (file.type === 'application/pdf' && !singleInvoiceMode) {
      try {
        const imageFiles = await splitPdfIntoImages(file);
        return imageFiles.map(imgFile => ({
          id: crypto.randomUUID(),
          file: imgFile,
          name: imgFile.name,
          size: imgFile.size,
          status: 'READY' as FileStatus,
          ext: 'jpg'
        }));
      } catch (err) {
        console.error("Failed to split PDF", err);
        // Fallback to uploading the PDF as is
        return [{
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          status: 'READY' as FileStatus,
          ext: file.name.split('.').pop()
        }];
      }
    } else {
      return [{
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        status: 'READY' as FileStatus,
        ext: file.name.split('.').pop()
      }];
    }
  }, [singleInvoiceMode]); // UseCallback to avoid dependency issues

  const handleFiles = useCallback(async (files: File[]) => {
    if (isProcessingGlobal || isExtractingFiles) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const validExtensions = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    const validFiles = files.filter(f => validExtensions.includes(f.type) && f.size <= MAX_SIZE);

    if (validFiles.length < files.length) {
       // Optional: Could toast an error here for invalid files
    }

    if (validFiles.length === 0) return;

    setIsExtractingFiles(true);
    try {
      let newItems: UploadQueueItem[] = [];
      for (const file of validFiles) {
        const processed = await processIncomingFile(file);
        newItems = [...newItems, ...processed];
      }

      setQueue(prev => [...prev, ...newItems]);
    } finally {
      setIsExtractingFiles(false);
    }
  }, [isProcessingGlobal, isExtractingFiles, processIncomingFile]); // Added processIncomingFile dependency

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!isProcessingGlobal) setIsHovering(true);
  }, [isProcessingGlobal]);

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsHovering(false);
    }
  }, []);

  const handleGlobalDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    if (!isProcessingGlobal && e.dataTransfer?.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [isProcessingGlobal, handleFiles]);

  useEffect(() => {
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragleave', handleGlobalDragLeave);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragleave', handleGlobalDragLeave);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDrop]);


  const retryFile = async (id: string) => {
    const item = queue.find(q => q.id === id);
    if (!item || isProcessingGlobal) return;
    
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'PROCESSING', message: undefined } : q));
    
    try {
      const res = await StockUploadService.extractInvoice(item.file);
      if (res.data) {
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'SUCCESS', extractedData: res.data ?? undefined } : q));
      } else {
        setQueue(prev => prev.map(q => q.id === id ? { 
          ...q, 
          status: 'FAILED', 
          message: 'The bill image is not clear. Kindly attach a clear copy.' 
        } : q));
      }
    } catch {
      setQueue(prev => prev.map(q => q.id === id ? { 
        ...q, 
        status: 'FAILED', 
        message: 'Failed to process document.' 
      } : q));
    }
    refreshRecent();
  };

  const handleProcessFiles = async () => {
    const filesToProcess = queue.filter(q => q.status === 'READY');
    if (filesToProcess.length === 0) return;

    setIsProcessingGlobal(true);
    
    // Mark them as PROCESSING
    setQueue(prev => prev.map(item => 
      filesToProcess.some(f => f.id === item.id) ? { ...item, status: 'PROCESSING' } : item
    ));

    for (const item of filesToProcess) {
      try {
        const res = await StockUploadService.extractInvoice(item.file);
        if (res.data) {
          setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'SUCCESS', extractedData: res.data ?? undefined } : q));
        } else {
          setQueue(prev => prev.map(q => q.id === item.id ? { 
            ...q, 
            status: 'FAILED', 
            message: 'The bill image is not clear. Kindly attach a clear copy.' 
          } : q));
        }
      } catch {
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'FAILED', 
          message: 'Failed to process document.' 
        } : q));
      }
    }

    setIsProcessingGlobal(false);
    refreshRecent();
  };

  const removeFile = (id: string) => {
    if (!isProcessingGlobal) {
      setQueue(prev => prev.filter(q => q.id !== id));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const readyCount = queue.filter(q => q.status === 'READY').length;
  const processingCount = queue.filter(q => q.status === 'PROCESSING').length;
  const successCount = queue.filter(q => q.status === 'SUCCESS').length;
  const failedCount = queue.filter(q => q.status === 'FAILED').length;

  return (
    <div className={`relative flex flex-col gap-6 w-full min-w-0 ${isHovering ? 'pb-20' : ''}`}>

      {isHovering && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-none transition-all animate-[fadeIn_0.15s_ease-out]">
          <div className="absolute inset-6 rounded-[28px] border-2 border-dashed border-white/20" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-xl">
              <Upload size={28} className="text-white" />
            </div>
            <span className="text-[18px] font-black text-white tracking-tight">Drop invoices here</span>
            <span className="text-[12px] font-medium text-white/40">PDF, PNG, JPG supported</span>
          </div>
        </div>
      )}

      {/* Upload Top Area */}
      <div className="bg-white dark:bg-card border border-border-main rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-primary-text flex items-center gap-2 tracking-tight">
            <Bot size={16} /> Upload Product Bill
          </h2>
          <span className="px-2.5 py-1 bg-[#3b0764] text-[#d8b4fe] text-[10px] font-black uppercase tracking-wider rounded-md">
            AI Powered
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface/50 border border-border-main rounded-xl mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-bold text-primary-text">Single Invoice Processing</span>
            <span className="text-[12px] text-muted-text max-w-sm">
              {singleInvoiceMode ? 'Each file is treated as one complete invoice.' : 'Multi-page PDFs will be split into individual invoice images.'}
            </span>
          </div>
          <button 
            role="switch" 
            aria-checked={singleInvoiceMode}
            disabled={isProcessingGlobal}
            onClick={() => setSingleInvoiceMode(!singleInvoiceMode)}
            className={`w-12 h-6 rounded-full relative transition-colors ${singleInvoiceMode ? 'bg-[#1a1a1a]' : 'bg-neutral-800'} ${isProcessingGlobal ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${singleInvoiceMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <p className="text-[12px] text-muted-text mb-4 font-medium">
          Powered by <strong className="text-primary-text">Gemini AI</strong>. Upload receipts or invoices — our system will extract product data automatically.
        </p>

        {pendingBatches.length > 0 && (
          <div 
            onClick={() => setShowInboundModal(true)}
            className="flex items-center justify-between p-3.5 mb-5 bg-yellow-500/10 dark:bg-yellow-600/5 border hover:border-yellow-500/50 cursor-pointer border-dashed rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600/50 rounded-lg">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black">{pendingBatches.length} Pending Bill{pendingBatches.length > 1 ? 's' : ''} Found</span>
                <span className="text-[11px]">
                  Last bill: <strong className="font-bold">Ref: {pendingBatches[0].refNo || `Batch ${pendingBatches[0].id}`}</strong>
                </span>
              </div>
            </div>
            <button className="w-7 h-7 flex items-center justify-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-500 rounded-full transition-colors" onClick={async (e) => {
              e.stopPropagation();
              const batchesToDelete = [...pendingBatches];
              setPendingBatches([]); // Optimistic dismiss
              for (const batch of batchesToDelete) {
                try {
                  await StockUploadService.deleteBatch(batch.id);
                } catch (err) {
                  console.error('Failed to delete batch', batch.id, err);
                }
              }
              toast.success(`${batchesToDelete.length} pending batch${batchesToDelete.length > 1 ? 'es' : ''} deleted`);
            }}>
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        )}

        <div 
          onClick={() => !isProcessingGlobal && !isExtractingFiles && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 transition-colors ${isProcessingGlobal || isExtractingFiles ? 'border-border-main/50 bg-black/5 opacity-60 cursor-not-allowed' : 'border-border-main hover:border-btn-primary/50 hover:bg-surface/50 cursor-pointer'}`}
        >
          <div className="p-3 bg-neutral-800 rounded-full text-white mb-1">
            <Upload size={24} strokeWidth={2} />
          </div>
          <strong className="text-[15px] text-primary-text">Upload your bills & invoices</strong>
          <span className="text-[13px] text-muted-text">Drag and drop or click to select · JPG, PNG, PDF up to 10MB each</span>
          
          <div className="flex items-center gap-4 text-[11px] font-semibold text-secondary-text mt-2">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> AI Powered</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Auto Extract</span>
          </div>

          <button 
            disabled={isProcessingGlobal || isExtractingFiles}
            className="mt-4 px-6 py-2 bg-btn-primary text-btn-primary-fg text-[13px] font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isExtractingFiles ? (
              <><Loader2 size={14} className="animate-spin" /> Extracting Files...</>
            ) : (
              <><Upload size={14} /> Choose Files</>
            )}
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            multiple 
            accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          />
        </div>
      </div>

      {/* Queue List */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500">↻ Uploading ({processingCount})</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">✓ Success ({successCount})</span>
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500">✕ Failed ({failedCount})</span>
          </div>

          <div className="flex flex-col gap-3">
            {queue.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm relative overflow-hidden group ${
                  item.status === 'SUCCESS' ? 'border-emerald-500/30' : 
                  item.status === 'FAILED' ? 'border-red-500/30' : 
                  item.status === 'PROCESSING' ? 'border-blue-500/50 shadow-blue-500/10' :
                  'border-border-main'
                }`}
              >
                {/* Scanning Animation Overlay */}
                {item.status === 'PROCESSING' && (
                  <>
                    <div className="absolute inset-0 bg-blue-500/5" />
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent w-1/2 -skew-x-12 animate-[scan_2s_ease-in-out_infinite]" />
                  </>
                )}

                <div className="flex items-start gap-4 relative z-10 w-full min-w-0 pr-4">
                  <div className="w-10 h-10 shrink-0 bg-surface border border-border-main rounded-lg flex items-center justify-center text-secondary-text">
                    {item.status === 'SUCCESS' ? <Check size={20} className="text-emerald-500" /> : 
                     item.status === 'FAILED' ? <X size={20} className="text-red-500" /> : 
                     <FileText size={20} />}
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[14px] font-bold truncate ${item.status === 'FAILED' ? 'text-red-600' : 'text-primary-text'}`}>
                      {item.status === 'FAILED' && item.message ? item.message : item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] mt-0.5">
                      <span className="text-muted-text font-medium">{formatSize(item.size)}</span>
                      <span className="text-muted-text/30">•</span>
                      {item.status === 'READY' && <span className="text-secondary-text">Ready to process</span>}
                      {item.status === 'PROCESSING' && <span className="text-blue-500 font-bold flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Processing with AI...</span>}
                      {item.status === 'SUCCESS' && <span className="text-emerald-500 font-bold">Success</span>}
                      {item.status === 'FAILED' && <span className="text-red-500 font-bold">Failed to Extract Data</span>}
                    </div>
                  </div>
                </div>

                {!isProcessingGlobal && item.status === 'FAILED' && (
                  <div className="flex items-center gap-1.5 relative z-10 shrink-0">
                    {item.message !== 'The bill image is not clear. Kindly attach a clear copy.' && (
                      <button 
                        onClick={() => retryFile(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface text-muted-text hover:text-blue-500 transition-colors"
                        title="Retry processing"
                      >
                        <RefreshCw size={15} />
                      </button>
                    )}
                    <button 
                      onClick={() => removeFile(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface text-muted-text hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {!isProcessingGlobal && item.status === 'READY' && (
                  <button 
                    onClick={() => removeFile(item.id)}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md hover:bg-surface text-muted-text hover:text-red-500 transition-colors relative z-10"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            disabled={isProcessingGlobal || (readyCount === 0 && queue.length === 0)}
            onClick={() => {
              if (readyCount > 0) {
                handleProcessFiles();
              } else if (successCount > 0) {
                setShowConfirmModal(true);
              }
            }}
            className="w-full py-3.5 mt-2 bg-btn-primary text-btn-primary-fg text-[14px] font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingGlobal ? (
              <><Loader2 size={16} className="animate-spin" /> Processing {processingCount} Files...</>
            ) : readyCount > 0 ? (
              <><Play size={16} /> Process {readyCount} Files</>
            ) : (
              <><Play size={16} /> Inbound {successCount} File(s)</>
            )}
          </button>
          
          <div className="text-center">
            <span className="text-[11px] text-muted-text">AI will extract product data, prices, and inventory details</span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
      `}</style>

      {showConfirmModal && (
        <ConfirmStockModal 
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          queue={queue.filter(q => q.status === 'SUCCESS' && q.extractedData)}
          onSuccess={(itemId?: string) => {
            if (itemId) {
              setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'DUPLICATE' as FileStatus } : q));
            }
            // Check if there are any remaining SUCCESS items to confirm. If not, close the modal.
            const remaining = queue.filter(q => q.status === 'SUCCESS' && q.id !== itemId);
            if (remaining.length === 0) {
              setShowConfirmModal(false);
              setShowInboundModal(true);
            }
            refreshRecent();
          }}
        />
      )}

      {showInboundModal && (
        <InboundModal 
          isOpen={showInboundModal}
          onClose={() => setShowInboundModal(false)}
        />
      )}
    </div>
    
  );
};
