import { useState } from 'react';
import { X, Camera, Printer, CreditCard, ImagePlus, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConsumptionService } from '../../services/consumptionService';
import toast from 'react-hot-toast';

interface EndShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mopValue: number, posValue: number) => void;
  isLoading: boolean;
}

export const EndShiftModal = ({ isOpen, onClose, onConfirm, isLoading }: EndShiftModalProps) => {
  const [mopFile, setMopFile] = useState<File | null>(null);
  const [posFile, setPosFile] = useState<File | null>(null);
  const [mopExtractedValue, setMopExtractedValue] = useState<number | null>(null);
  const [posExtractedValue, setPosExtractedValue] = useState<number | null>(null);
  const [isExtractingMop, setIsExtractingMop] = useState(false);
  const [isExtractingPos, setIsExtractingPos] = useState(false);

  const handleFileUpload = async (file: File, isPos: boolean) => {
    if (isPos) {
      setPosFile(file);
      setIsExtractingPos(true);
      setPosExtractedValue(null);
    } else {
      setMopFile(file);
      setIsExtractingMop(true);
      setMopExtractedValue(null);
    }

    try {
      const res = await ConsumptionService.extractMposReceipt(file);
      if (res.success && res.data.value !== null) {
        if (isPos) {
          setPosExtractedValue(res.data.value);
        } else {
          setMopExtractedValue(res.data.value);
        }
        toast.success(`Extracted ₹${res.data.value} successfully`);
      } else {
        toast.error(res.data.message || 'Could not find a total value in this image');
      }
    } catch {
      toast.error('Extraction failed. You can still proceed manually.');
    } finally {
      if (isPos) setIsExtractingPos(false);
      else setIsExtractingMop(false);
    }
  };

  const isReadyToConfirm = !isExtractingMop && !isExtractingPos;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border-main shadow-2xl rounded-none md:rounded-2xl w-full max-w-[600px] overflow-hidden flex flex-col h-full md:h-auto max-h-screen md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-border-main flex items-center justify-between bg-secondary/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-text text-card flex items-center justify-center">
              <Camera size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[16px] font-bold text-primary-text">Upload Receipt Photos</h2>
              <p className="text-[12px] text-muted-text">Capture MOP and POS totals before ending shift</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-xl text-muted-text transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          
          {/* MOP Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary-text border border-border-main">
                <Printer size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary-text">MOP Machine Receipt</span>
                <span className="text-[11px] text-muted-text Leading-none">Ensure the total amount is clearly visible</span>
              </div>
            </div>

            <label className={`
              relative flex flex-col items-center justify-center gap-3 p-6 md:p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer
              ${mopFile ? 'border-primary-text bg-secondary/30' : 'border-border-main hover:border-muted-text bg-secondary/10'}
            `}>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
              />
              {isExtractingMop ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-muted-text" />
                  <span className="text-[12px] font-bold text-muted-text">Extracting total...</span>
                </div>
              ) : mopExtractedValue !== null ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-primary-text text-card flex items-center justify-center mb-1">
                    <Check size={20} />
                  </div>
                  <span className="text-[18px] font-bold text-primary-text">₹ {mopExtractedValue.toFixed(2)}</span>
                  <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Extracted Total</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImagePlus size={32} className="text-muted-text" />
                  <span className="text-[13px] font-bold text-primary-text">
                    {mopFile ? mopFile.name : 'Tap to upload MOP receipt'}
                  </span>
                  <span className="text-[11px] text-muted-text">JPG, PNG up to 10MB</span>
                </div>
              )}
            </label>
          </div>

          {/* POS Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary-text border border-border-main">
                <CreditCard size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-primary-text">POS Machine Receipt</span>
                <span className="text-[11px] text-muted-text Leading-none">Ensure the total amount is clearly visible</span>
              </div>
            </div>

            <label className={`
              relative flex flex-col items-center justify-center gap-3 p-6 md:p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer
              ${posFile ? 'border-primary-text bg-secondary/30' : 'border-border-main hover:border-muted-text bg-secondary/10'}
            `}>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
              />
              {isExtractingPos ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-muted-text" />
                  <span className="text-[12px] font-bold text-muted-text">Extracting total...</span>
                </div>
              ) : posExtractedValue !== null ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-primary-text text-card flex items-center justify-center mb-1">
                    <Check size={20} />
                  </div>
                  <span className="text-[18px] font-bold text-primary-text">₹ {posExtractedValue.toFixed(2)}</span>
                  <span className="text-[11px] text-muted-text font-bold uppercase tracking-wider">Extracted Total</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImagePlus size={32} className="text-muted-text" />
                  <span className="text-[13px] font-bold text-primary-text">
                    {posFile ? posFile.name : 'Tap to upload POS receipt'}
                  </span>
                  <span className="text-[11px] text-muted-text">JPG, PNG up to 10MB</span>
                </div>
              )}
            </label>
          </div>

          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl border border-border-main/50">
            <AlertCircle size={18} className="text-muted-text mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-text font-medium leading-relaxed">
              Extracted values will automatically pre-fill the Manager Audit form which appears after the shift concludes. You can still refine these values manually later if needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-main bg-secondary/20 flex flex-col md:flex-row items-center justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2.5 text-[13px] font-bold text-primary-text hover:bg-secondary rounded-xl transition-all border border-border-main"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(mopExtractedValue ?? 0, posExtractedValue ?? 0)}
            disabled={isLoading || !isReadyToConfirm}
            className="w-full md:w-auto px-8 py-2.5 bg-primary-text text-card text-[13px] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {(isLoading || isExtractingMop || isExtractingPos) && <Loader2 size={16} className="animate-spin" />}
            Confirm & End Shift
          </button>
        </div>
      </motion.div>
    </div>
  );
};
