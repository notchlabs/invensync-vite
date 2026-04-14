import Skeleton from "react-loading-skeleton";


const SK_ROWS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const


export function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Strategy */}
      <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-2">
        <Skeleton width={160} height={14} borderRadius={4} />
        <Skeleton height={12} borderRadius={4} />
        <Skeleton height={12} borderRadius={4} />
        <Skeleton width="80%" height={12} borderRadius={4} />
        <Skeleton width="60%" height={12} borderRadius={4} />
      </div>
      {/* Table */}
      <div className="bg-card border border-border-main rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-main flex items-center justify-between">
          <Skeleton width={140} height={14} borderRadius={4} />
          <div className="flex gap-2">
            <Skeleton width={70} height={32} borderRadius={8} />
            <Skeleton width={90} height={32} borderRadius={8} />
          </div>
        </div>
        <table className="w-full">
          <tbody>
            {SK_ROWS.map(k => (
              <tr key={k} className="border-b border-border-main">
                <td className="px-4 py-4 w-10"><Skeleton width={16} height={12} borderRadius={4} /></td>
                <td className="px-4 py-4"><Skeleton width={200} height={13} borderRadius={4} /></td>
                <td className="px-4 py-4 text-center"><Skeleton width={32} height={18} borderRadius={4} /></td>
                <td className="px-4 py-4 text-center"><Skeleton width={24} height={13} borderRadius={4} /></td>
                <td className="px-4 py-4 text-center"><Skeleton width={24} height={13} borderRadius={4} /></td>
                <td className="px-4 py-4"><Skeleton width={220} height={12} borderRadius={4} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}