import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { UploadArea } from '../../components/stock-upload/UploadArea';
import { RecentlyUploadedBills } from '../../components/stock-upload/RecentlyUploadedBills';

export default function AddStockPage() {

  // State to trigger refetch in RecentlyUploadedBills
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 pb-20">
        <PageHeader 
          title="Add Stock" 
          description="Upload product bills and invoices to automatically extract inventory data" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-6 items-start">
          <UploadArea refreshRecent={() => setRefreshTrigger(prev => prev + 1)} />
          
          <div className="sticky top-6">
            <RecentlyUploadedBills key={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}
