import type { POOrderItem } from "../../services/purchaseOrderService";

export function OrderRow({
  order, index,
}: Readonly<{ order: POOrderItem; index: number }>) {
  return (
    <tr className="border-b border-border-main hover:bg-surface/50 transition-colors">
      <td className="px-4 py-3.5 text-[12px] font-bold text-muted-text w-10">{index + 1}</td>
      <td className="px-4 py-3.5">
        <p className="text-[13px] font-bold text-primary-text leading-snug">{order.name}</p>
        <p className="text-[10px] text-muted-text font-medium mt-0.5">{order.refNo}</p>
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="text-[15px] font-black text-primary-text">{order.qtyToOrder}</span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="text-[13px] font-semibold text-secondary-text">{order.packets}</span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <span className="text-[13px] font-semibold text-secondary-text">{order.lotSize}</span>
      </td>
    </tr>
  )
}
