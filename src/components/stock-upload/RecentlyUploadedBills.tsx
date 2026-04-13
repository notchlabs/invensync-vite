import { useState, useEffect } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import { StockUploadService, type UploadBatch } from '../../services/stockUploadService';
import { BillViewModal } from './BillViewModal';

export const RecentlyUploadedBills = () => {
  const [filter, setFilter] = useState<'Today' | 'Yesterday'>('Today');
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewBatch, setViewBatch] = useState<UploadBatch | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBatches = async (currentFilter: 'Today' | 'Yesterday', currentPage: number) => {
    setIsLoading(true);
    try {
      const now = new Date();
      if (currentFilter === 'Yesterday') {
        now.setDate(now.getDate() - 1);
      }
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const startDate = `${year}-${month}-${day}T00:00:00`;
      const endDate = `${year}-${month}-${day}T23:59:59`;

      const response = await StockUploadService.fetchBatches({ startDate, endDate }, currentPage, 6);
      if (response.data) {
        setBatches(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch batches', err);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches(filter, page);
  }, [filter, page]);

  const handleFilterChange = (newFilter: 'Today' | 'Yesterday') => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      setPage(0);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-card border border-border-main rounded-xl p-4 sm:p-5 flex flex-col h-full shadow-sm relative w-full overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleFilterChange('Today')}
          className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center ${
            filter === 'Today'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
              : 'bg-surface border border-border-main text-secondary-text hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleFilterChange('Yesterday')}
          className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center ${
            filter === 'Yesterday'
              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
              : 'bg-surface border border-border-main text-secondary-text hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Yesterday
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-primary-text mb-1 tracking-tight">Recently Uploaded Bills</h2>
        <p className="text-[12px] text-muted-text">Here you will see the most recent bills you've uploaded. Click any entry to review.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[300px]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-3 border border-border-main/50 rounded-xl flex items-center justify-between">
              <div className="flex flex-col gap-1.5 w-2/3">
                <Skeleton width="60%" height={14} />
                <Skeleton width="40%" height={12} />
                <Skeleton width="50%" height={12} />
              </div>
              <div className="flex flex-col gap-1.5 items-end w-1/3">
                <Skeleton width="70%" height={16} />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
          ))
        ) : batches.length > 0 ? (
          batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => setViewBatch(batch)}
              className="flex justify-between items-center p-3.5 border border-border-main rounded-xl hover:border-btn-primary/30 transition-colors group cursor-pointer bg-surface/30"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={16} className="text-secondary-text shrink-0" />
                  <strong className="text-primary-text text-[14px] font-bold truncate tracking-tight">{batch.refNo}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-text pl-6 mb-0.5">
                  <span className="truncate">{batch.supplierName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-text pl-6">
                  <span className="truncate">{batch.siteNames}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div className="flex flex-col justify-center">
                  <strong className="text-primary-text text-[15px] font-bold">₹{batch.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  <span className="text-[11px] text-muted-text font-medium mt-0.5">{formatDate(batch.createdAt)}</span>
                </div>
                <ChevronRight size={16} className="text-muted-text group-hover:text-primary-text transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-main rounded-xl bg-surface/50">
            <FileText size={48} className="mb-3 opacity-30 text-secondary-text" strokeWidth={1} />
            <span className="text-[14px] font-bold text-primary-text mb-1">No bills found</span>
            <span className="text-[12px] text-muted-text">There are no recent uploads for {filter}.</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-border-main flex items-center justify-between">
          <button 
            disabled={page === 0 || isLoading}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-[12px] font-bold text-primary-text border border-border-main rounded-md disabled:opacity-50 hover:bg-surface transition-all"
          >
            Previous
          </button>
          <span className="text-[12px] font-medium text-secondary-text">Page {page + 1} of {totalPages}</span>
          <button 
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-[12px] font-bold text-primary-text border border-border-main rounded-md disabled:opacity-50 hover:bg-surface transition-all"
          >
            Next
          </button>
        </div>
      )}

      {viewBatch && (
        <BillViewModal
          isOpen={!!viewBatch}
          onClose={() => setViewBatch(null)}
          batch={viewBatch}
        />
      )}
    </div>
  );
};
