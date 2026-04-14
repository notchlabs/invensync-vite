import { SearchableSingleSelect } from './SearchableSingleSelect'
import { InventoryService } from '../../services/inventoryService'
import { useEffect, useRef } from 'react'

export interface ConsumptionUnit {
  id: number
  label: string
  description?: string
  dsrNo?: string
}

interface ConsumptionUnitSelectProps {
  siteId: number
  value: ConsumptionUnit | null
  onChange: (unit: ConsumptionUnit | null) => void
  initialCuId?: number | null
  label?: string
  className?: string
  error?: boolean
  openUpwards?: boolean
}

export function ConsumptionUnitSelect({ 
  siteId, 
  value, 
  onChange, 
  initialCuId = null,
  label, 
  className = '', 
  error, 
  openUpwards 
}: ConsumptionUnitSelectProps) {
  const hasLoadedRecentFor = useRef<number | null>(null)

  useEffect(() => {
    const handleInitialSelection = async () => {
      // Only auto-load if we have a siteId and haven't loaded for this site yet
      if (!siteId || hasLoadedRecentFor.current === siteId || value) return
      
      try {
        let targetId = initialCuId

        if (!targetId) {
          const recentRes = await InventoryService.fetchRecentConsumptionId(siteId)
          targetId = recentRes.data
        }

        if (targetId) {
          // Fetch all units to find the matching one to auto-select
          const unitsRes = await InventoryService.fetchConsumptionUnits(siteId)
          const units = unitsRes.data?.content || []
          const found = units.find((u: ConsumptionUnit) => u.id === Number(targetId))
          if (found) {
            onChange(found)
          }
        }
      } catch (err) {
        console.error('Failed to resolve consumption unit:', err)
      } finally {
        // Mark as loaded even on error to prevent infinite loops
        hasLoadedRecentFor.current = siteId
      }
    }

    handleInitialSelection()
  }, [siteId, onChange, value, initialCuId])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-[12px] font-black text-primary-text uppercase tracking-wider">{label}</label>}
      <SearchableSingleSelect<ConsumptionUnit>
        placeholder="Select Consumption Type..."
        fetchData={async (query) => {
          const res = await InventoryService.fetchConsumptionUnits(siteId, query)
          return res.data?.content || []
        }}
        keyExtractor={(item) => item.id}
        displayValue={(item) => item.label}
        value={value}
        onChange={onChange}
        className={error ? 'border-red-500 ring-2 ring-red-500/10' : ''}
        openUpwards={openUpwards}
        renderValue={(item) => (
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold text-primary-text leading-tight">{item.dsrNo}</span>
            {item.description && (
              <span className="text-[11px] text-muted-text font-medium italic line-clamp-1 mt-0.5">{item.description}</span>
            )}
          </div>
        )}
        renderLabel={(item) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold text-primary-text">{item.dsrNo}</span>
            {item.description && (
              <span className="text-[11px] text-muted-text italic line-clamp-1">{item.description}</span>
            )}
          </div>
        )}
      />
    </div>
  )
}
