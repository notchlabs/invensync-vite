import { useState } from 'react';
import {
  X,
  Camera,
  Printer,
  CreditCard,
  ImagePlus,
  Loader2,
  Check,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Users,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ConsumptionService } from '../../services/consumptionService';
import toast from 'react-hot-toast';

interface EndShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mopValue: number, posValue: number) => Promise<boolean> | void;
  onSendWhatsApp: () => void;
  isLoading?: boolean;
  selectedDate?: string;
}

export const EndShiftModal = ({
  isOpen,
  onClose,
  onConfirm,
  onSendWhatsApp,
  isLoading: externalLoading
}: EndShiftModalProps) => {
  const [mopFile, setMopFile] = useState<File | null>(null);
  const [posFile, setPosFile] = useState<File | null>(null);
  const [mopExtractedValue, setMopExtractedValue] = useState<number | null>(null);
  const [posExtractedValue, setPosExtractedValue] = useState<number | null>(null);
  const [isExtractingMop, setIsExtractingMop] = useState(false);
  const [isExtractingPos, setIsExtractingPos] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    try {
      const result = await onConfirm(mopExtractedValue ?? 0, posExtractedValue ?? 0);
      if (result !== false) {
        setIsSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  const isReadyToConfirm = !isExtractingMop && !isExtractingPos && !isSubmitting && !externalLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCloseModal}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border-main shadow-2xl rounded-none md:rounded-2xl w-full max-w-[540px] overflow-hidden flex flex-col h-full md:h-auto max-h-screen md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-3.5 px-4 border-b border-border-main flex items-center justify-between bg-secondary/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              {isSuccess ? <Check size={16} strokeWidth={3} /> : <Camera size={16} />}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[14.5px] font-bold text-primary-text leading-tight">
                {isSuccess ? 'Shift Concluded Successfully!' : 'Upload Receipt Photos'}
              </h2>
            </div>
          </div>
          <button 
            onClick={handleCloseModal}
            className="p-1.5 hover:bg-secondary rounded-xl text-muted-text transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-5 my-auto flex-1 overflow-y-auto custom-scrollbar">
            {/* 1. Hero Checkmark Badge & Headings */}
            <div className="flex flex-col items-center text-center gap-2.5 w-full">
              <div className="relative flex items-center justify-center p-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                    <Check size={22} strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 max-w-[420px] items-center text-center">
                <h2 className="text-[18px] sm:text-[20px] font-extrabold text-primary-text tracking-tight text-center">
                  Great! Your shift is concluded.
                </h2>
                <p className="text-[11.5px] sm:text-[12px] text-muted-text leading-relaxed text-center">
                  Sales data for this date is recorded and locked.<br />
                  Share the daily report with your WhatsApp group.
                </p>
              </div>
            </div>

            {/* 2. 3-Step Process Guidance Card */}
            <div className="w-full bg-secondary/30 border border-border-main p-4 rounded-xl flex flex-col items-center text-center gap-4">
              <div className="flex flex-col items-center justify-center text-center gap-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-0.5">
                  <MessageCircle size={16} />
                </div>
                <span className="text-[13px] font-bold text-primary-text text-center">Send Daily Report to WhatsApp Group</span>
                <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold text-center">Just 3 simple steps</span>
              </div>

              {/* 3 Step Cards Grid */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {/* Step 1 */}
                <div className="flex flex-col items-center justify-center text-center gap-1.5 p-2.5 bg-card border border-border-main rounded-xl relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center -top-2 absolute z-10 shadow-sm">
                    1
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-emerald-500 mt-0.5">
                    <ExternalLink size={15} />
                  </div>
                  <span className="text-[11px] sm:text-[11.5px] font-bold text-primary-text leading-tight text-center">Click Send</span>
                  <span className="text-[9px] sm:text-[9.5px] text-muted-text leading-tight text-center">Click the button below to open WhatsApp.</span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center justify-center text-center gap-1.5 p-2.5 bg-card border border-border-main rounded-xl relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center -top-2 absolute z-10 shadow-sm">
                    2
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-emerald-500 mt-0.5">
                    <Users size={15} />
                  </div>
                  <span className="text-[11px] sm:text-[11.5px] font-bold text-primary-text leading-tight text-center">Select Group</span>
                  <span className="text-[9px] sm:text-[9.5px] text-muted-text leading-tight text-center">Choose "Rengali Wildbean Cafe" from WhatsApp.</span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center justify-center text-center gap-1.5 p-2.5 bg-card border border-border-main rounded-xl relative">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center -top-2 absolute z-10 shadow-sm">
                    3
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-emerald-500 mt-0.5">
                    <ClipboardCheck size={15} />
                  </div>
                  <span className="text-[11px] sm:text-[11.5px] font-bold text-primary-text leading-tight text-center">Paste & Send</span>
                  <span className="text-[9px] sm:text-[9.5px] text-muted-text leading-tight text-center">Paste the report (Ctrl+V or Cmd+V) and hit send.</span>
                </div>
              </div>
            </div>

            {/* 3. Primary WhatsApp CTA Button */}
            <button
              onClick={() => {
                onSendWhatsApp();
                handleCloseModal();
              }}
              className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-[13.5px] rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-between transition-all cursor-pointer border border-emerald-500/30 group"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle size={18} className="shrink-0" />
                <span className="tracking-tight">Click to Send Daily Report</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-semibold bg-white/20 px-2 py-0.5 rounded">Opens WhatsApp</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 md:p-6 flex-1 overflow-y-auto flex flex-col gap-6 custom-scrollbar">

              {/* MOP Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary-text border border-border-main">
                    <Printer size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary-text">MOP Machine Receipt</span>
                    <span className="text-[11px] text-muted-text leading-none">Ensure the total amount is clearly visible</span>
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
                    <span className="text-[11px] text-muted-text leading-none">Ensure the total amount is clearly visible</span>
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
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-2.5 text-[13px] font-bold text-primary-text hover:bg-secondary rounded-xl transition-all border border-border-main disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClick}
                disabled={!isReadyToConfirm}
                className="w-full md:w-auto px-8 py-2.5 bg-primary-text text-card text-[13px] font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {(isSubmitting || externalLoading || isExtractingMop || isExtractingPos) && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Ending Shift...' : 'Confirm & End Shift'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
