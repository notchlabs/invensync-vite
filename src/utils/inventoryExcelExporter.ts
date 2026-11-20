import type { InventoryItem } from '../types/inventory'

export interface ExportColumnConfig {
  id: string
  label: string
  enabled: boolean
  isFinancial?: boolean
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumnConfig[] = [
  { id: 'productName', label: 'Product Name', enabled: true },
  { id: 'site', label: 'Site', enabled: true },
  { id: 'siteCity', label: 'City', enabled: true },
  { id: 'quantity', label: 'Available Qty', enabled: true },
  { id: 'unit', label: 'Unit', enabled: true },
  { id: 'price', label: 'Price / Unit (₹)', enabled: true, isFinancial: true },
  { id: 'taxPerc', label: 'Tax %', enabled: true, isFinancial: true },
  { id: 'taxPerUnit', label: 'Tax / Unit (₹)', enabled: true, isFinancial: true },
  { id: 'totalExcludingTax', label: 'Net Amount (Excl. Tax)', enabled: true, isFinancial: true },
  { id: 'totalIncludingTax', label: 'Total Amount (Inc. Tax)', enabled: true, isFinancial: true },
  { id: 'hsnCode', label: 'HSN Code', enabled: true },
  { id: 'vendorNames', label: 'Vendors / Suppliers', enabled: true },
  { id: 'mrp', label: 'MRP (₹)', enabled: false, isFinancial: true },
  { id: 'barcode', label: 'Barcode', enabled: false },
]

export interface ExportMetadata {
  siteNames?: string[]
  productNames?: string[]
  vendorNames?: string[]
  searchTerm?: string | null
  totalElements?: number
}

interface ExcelColumnDef {
  header: string
  key: string
  width: number
  align: 'left' | 'center' | 'right'
  numFmt?: string
}

export async function exportInventoryToExcel(
  items: InventoryItem[],
  selectedColumnIds: Set<string>,
  canSeeFinancials: boolean,
  metadata?: ExportMetadata,
  filename?: string
) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Inventory Report')

  ws.views = [{ showGridLines: true }]

  // Filter columns based on user selection & permissions
  const activeCols = DEFAULT_EXPORT_COLUMNS.filter(
    col => selectedColumnIds.has(col.id) && (!col.isFinancial || canSeeFinancials)
  )

  // Map columns to ExcelJS column definitions
  const columnsDef: ExcelColumnDef[] = [
    { header: '#', key: 'idx', width: 6, align: 'center' },
    ...activeCols.map((c): ExcelColumnDef => {
      let width = 20
      let align: 'left' | 'center' | 'right' = 'left'
      let numFmt: string | undefined

      switch (c.id) {
        case 'productName':
          width = 38
          align = 'left'
          break
        case 'site':
          width = 24
          align = 'left'
          break
        case 'siteCity':
          width = 16
          align = 'left'
          break
        case 'quantity':
          width = 16
          align = 'right'
          numFmt = '#,##0.00'
          break
        case 'unit':
          width = 10
          align = 'center'
          break
        case 'price':
        case 'taxPerUnit':
        case 'mrp':
          width = 16
          align = 'right'
          numFmt = '₹#,##0.00'
          break
        case 'taxPerc':
          width = 12
          align = 'right'
          numFmt = '0.00"%"'
          break
        case 'totalExcludingTax':
        case 'totalIncludingTax':
          width = 22
          align = 'right'
          numFmt = '₹#,##0.00'
          break
        case 'hsnCode':
          width = 14
          align = 'center'
          break
        case 'vendorNames':
          width = 32
          align = 'left'
          break
        case 'barcode':
          width = 18
          align = 'center'
          break
      }

      return {
        header: c.label,
        key: c.id,
        width,
        align,
        numFmt,
      }
    }),
  ]

  // Set worksheet columns
  ws.columns = columnsDef.map(col => ({ key: col.key, width: col.width }))

  const totalCols = columnsDef.length
  const lastColLetter = getColumnLetter(totalCols)

  // 1. Title Banner
  ws.mergeCells(`A1:${lastColLetter}1`)
  const titleCell = ws.getCell('A1')
  titleCell.value = 'INVENSYNC • INVENTORY STOCK REPORT'
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } } // Teal-700
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 36

  // 2. Generation timestamp Subheader
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  
  ws.mergeCells(`A2:${lastColLetter}2`)
  const subCell = ws.getCell('A2')
  subCell.value = `Exported on: ${dateStr} at ${timeStr} • Total Records: ${items.length.toLocaleString()}`
  subCell.font = { italic: true, color: { argb: 'FF475569' }, size: 9.5 }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 20

  // 3. Filter criteria summary (if metadata provided)
  let currentRow = 4
  if (metadata) {
    const filters: string[] = []
    if (metadata.siteNames && metadata.siteNames.length > 0) {
      filters.push(`Sites: ${metadata.siteNames.join(', ')}`)
    }
    if (metadata.vendorNames && metadata.vendorNames.length > 0) {
      filters.push(`Vendors: ${metadata.vendorNames.join(', ')}`)
    }
    if (metadata.productNames && metadata.productNames.length > 0) {
      filters.push(`Products: ${metadata.productNames.join(', ')}`)
    }
    if (metadata.searchTerm) {
      filters.push(`Search: "${metadata.searchTerm}"`)
    }

    if (filters.length > 0) {
      ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
      const filterCell = ws.getCell(`A${currentRow}`)
      filterCell.value = `Active Filters: ${filters.join(' | ')}`
      filterCell.font = { bold: true, color: { argb: 'FF0F766E' }, size: 9 }
      filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } }
      filterCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      ws.getRow(currentRow).height = 22
      currentRow++
    }
  }

  // Blank spacer row
  ws.getRow(currentRow).height = 10
  currentRow++

  // 4. Table Header Row
  const headerRowIndex = currentRow
  const headerRow = ws.getRow(headerRowIndex)
  headerRow.height = 26

  columnsDef.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.header.toUpperCase()
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } } // Slate 800
    cell.alignment = {
      vertical: 'middle',
      horizontal: col.align || 'left',
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    }
  })

  currentRow++

  // 5. Data Rows
  let totalQty = 0
  let totalNetAmt = 0
  let totalGrossAmt = 0

  items.forEach((item, idx) => {
    const row = ws.getRow(currentRow)
    row.height = 22

    totalQty += item.quantity || 0
    totalNetAmt += item.totalExcludingTax || 0
    totalGrossAmt += item.totalIncludingTax || 0

    const taxPerc = (item.cgstInPerc || 0) + (item.sgstInPerc || 0)

    columnsDef.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1)

      if (col.key === 'idx') {
        cell.value = idx + 1
      } else {
        switch (col.key) {
          case 'productName':
            cell.value = item.productName || '—'
            break
          case 'site':
            cell.value = item.site || '—'
            break
          case 'siteCity':
            cell.value = item.siteCity || '—'
            break
          case 'quantity':
            cell.value = item.quantity ?? 0
            break
          case 'unit':
            cell.value = item.unit || '—'
            break
          case 'price':
            cell.value = item.price ?? 0
            break
          case 'taxPerc':
            cell.value = taxPerc
            break
          case 'taxPerUnit':
            cell.value = item.taxPerUnit ?? 0
            break
          case 'totalExcludingTax':
            cell.value = item.totalExcludingTax ?? 0
            break
          case 'totalIncludingTax':
            cell.value = item.totalIncludingTax ?? 0
            break
          case 'hsnCode':
            cell.value = item.hsnCode || '—'
            break
          case 'vendorNames':
            cell.value = item.vendorNames || '—'
            break
          case 'mrp':
            cell.value = item.mrp ?? 0
            break
          case 'barcode':
            cell.value = item.barcode || '—'
            break
          default:
            cell.value = '—'
        }
      }

      cell.alignment = { vertical: 'middle', horizontal: col.align || 'left' }
      cell.font = { size: 9.5, color: { argb: 'FF1E293B' } }

      if (col.numFmt && typeof cell.value === 'number') {
        cell.numFmt = col.numFmt
      }

      // Zebra striping
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }

      // Border
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })

    currentRow++
  })

  // 6. Summary / Grand Totals Row
  const summaryRow = ws.getRow(currentRow)
  summaryRow.height = 28

  columnsDef.forEach((col, cIdx) => {
    const cell = summaryRow.getCell(cIdx + 1)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    cell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    }

    if (cIdx === 0 || (cIdx === 1 && !columnsDef.some(c => c.key === 'productName'))) {
      cell.value = 'TOTALS'
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    } else if (col.key === 'quantity') {
      cell.value = totalQty
      cell.numFmt = '#,##0.00'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
    } else if (col.key === 'totalExcludingTax' && canSeeFinancials) {
      cell.value = totalNetAmt
      cell.numFmt = '₹#,##0.00'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.font = { bold: true, size: 11, color: { argb: 'FF0F766E' } }
    } else if (col.key === 'totalIncludingTax' && canSeeFinancials) {
      cell.value = totalGrossAmt
      cell.numFmt = '₹#,##0.00'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
      cell.font = { bold: true, size: 11, color: { argb: 'FF0369A1' } }
    } else {
      cell.value = ''
    }
  })

  currentRow += 2

  // 7. Footer note
  ws.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`)
  const noteCell = ws.getCell(`A${currentRow}`)
  noteCell.value = 'Confidential Report • Generated by InvenSync Inventory Management Platform'
  noteCell.font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } }
  noteCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // 8. Generate File Download
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeDate = new Date().toISOString().slice(0, 10)
  a.download = filename || `inventory-export-${safeDate}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getColumnLetter(colIndex: number): string {
  let letter = ''
  let temp = colIndex
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - mod) / 26)
  }
  return letter || 'A'
}
