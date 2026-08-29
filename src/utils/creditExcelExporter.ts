import type { CreditCustomer, CreditTransaction } from '../services/creditCustomerService'

export async function exportCreditBillToExcel(
  customer: CreditCustomer,
  items: CreditTransaction[],
  filename?: string
) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Credit Statement')

  const pendingItems = items.filter(t => t.type === 'CONSUMPTION_CREDIT')
  const totalAmount = pendingItems.reduce((acc, i) => acc + (i.amount || 0), 0)

  const issueDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const issueTimeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Page Setup & Gridlines
  ws.views = [{ showGridLines: true }]

  // Set Column Widths
  ws.columns = [
    { key: 'colA', width: 8 },  // #
    { key: 'colB', width: 24 }, // Date & Time
    { key: 'colC', width: 42 }, // Item / Product Name
    { key: 'colD', width: 14 }, // Qty
    { key: 'colE', width: 22 }, // Amount (INR)
  ]

  // 1. Title Banner (Merged A1:E1)
  ws.mergeCells('A1:E1')
  const titleCell = ws.getCell('A1')
  titleCell.value = 'INVENSYNC • PENDING CREDIT BILL STATEMENT'
  titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } } // Emerald 600
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 36

  // 2. Metadata Subheader Row (A2:E2)
  ws.mergeCells('A2:E2')
  const subCell = ws.getCell('A2')
  subCell.value = `Statement Generated: ${issueDateStr}, ${issueTimeStr}`
  subCell.font = { italic: true, color: { argb: 'FF6B7280' }, size: 10 }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 20

  // Empty spacer
  ws.getRow(3).height = 10

  // 3. Customer & Credit Summary Block (Rows 4 & 5)
  ws.getCell('A4').value = 'BILLED TO (CUSTOMER):'
  ws.getCell('A4').font = { bold: true, color: { argb: 'FF059669' }, size: 9 }
  ws.getCell('B4').value = customer.name
  ws.getCell('B4').font = { bold: true, color: { argb: 'FF111827' }, size: 12 }

  ws.getCell('D4').value = 'TOTAL CREDIT DUE:'
  ws.getCell('D4').font = { bold: true, color: { argb: 'FF059669' }, size: 9 }
  ws.getCell('D4').alignment = { horizontal: 'right' }

  ws.getCell('E4').value = totalAmount
  ws.getCell('E4').numFmt = '₹#,##0.00'
  ws.getCell('E4').font = { bold: true, color: { argb: 'FFD97706' }, size: 13 }
  ws.getCell('E4').alignment = { horizontal: 'right' }

  if (customer.phone) {
    ws.getCell('A5').value = 'CUSTOMER PHONE:'
    ws.getCell('A5').font = { bold: true, color: { argb: 'FF6B7280' }, size: 9 }
    ws.getCell('B5').value = customer.phone
    ws.getCell('B5').font = { color: { argb: 'FF374151' }, size: 10 }
  }

  ws.getRow(4).height = 24
  ws.getRow(5).height = 20

  // Empty spacer
  ws.getRow(6).height = 12

  // 4. Itemized Table Header (Row 7)
  const headerRow = ws.getRow(7)
  headerRow.height = 26
  const headers = ['#', 'DATE & TIME', 'ITEM / PRODUCT NAME', 'QTY', 'AMOUNT (₹)']
  headers.forEach((h, idx) => {
    const colNum = idx + 1
    const cell = headerRow.getCell(colNum)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FF065F46' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } } // Mint Green
    cell.alignment = {
      vertical: 'middle',
      horizontal: colNum === 1 || colNum === 4 ? 'center' : colNum === 5 ? 'right' : 'left',
    }
  })

  // 5. Data Rows (Starting at Row 8)
  let currentRowIndex = 8
  pendingItems.forEach((item, idx) => {
    const row = ws.getRow(currentRowIndex)
    row.height = 22

    const dt = new Date(item.date)
    const dtFormatted = `${dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`

    let nameDisplay = item.productName || item.notes || 'Loyalty Credit Consumption'
    if (nameDisplay.startsWith('Consumption: ')) {
      nameDisplay = nameDisplay.replace('Consumption: ', '')
    }

    const qtyDisplay = item.qty ? `${item.qty} ${item.unit || ''}`.trim() : '1'

    // Col A: #
    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(1).font = { bold: true, color: { argb: 'FF047857' }, size: 10 }

    // Col B: Date & Time
    row.getCell(2).value = dtFormatted
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(2).font = { color: { argb: 'FF4B5563' }, size: 9.5 }

    // Col C: Item / Product Name
    row.getCell(3).value = nameDisplay
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(3).font = { bold: true, color: { argb: 'FF111827' }, size: 10 }

    // Col D: Qty
    row.getCell(4).value = qtyDisplay
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(4).font = { color: { argb: 'FF374151' }, size: 9.5 }

    // Col E: Amount
    row.getCell(5).value = item.amount || 0
    row.getCell(5).numFmt = '₹#,##0.00'
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(5).font = { bold: true, color: { argb: 'FFD97706' }, size: 10.5 }

    // Alternating Row Shading
    if (idx % 2 === 1) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
      }
    }

    // Grid Borders
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    }

    currentRowIndex++
  })

  // Empty spacer
  ws.getRow(currentRowIndex).height = 10
  currentRowIndex++

  // 6. Grand Total Summary Row
  const totalRow = ws.getRow(currentRowIndex)
  totalRow.height = 28

  ws.mergeCells(`A${currentRowIndex}:D${currentRowIndex}`)
  const totalLabelCell = ws.getCell(`A${currentRowIndex}`)
  totalLabelCell.value = 'TOTAL AMOUNT DUE:'
  totalLabelCell.font = { bold: true, color: { argb: 'FF111827' }, size: 11 }
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalValCell = ws.getCell(`E${currentRowIndex}`)
  totalValCell.value = totalAmount
  totalValCell.numFmt = '₹#,##0.00'
  totalValCell.font = { bold: true, color: { argb: 'FFD97706' }, size: 14 }
  totalValCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } } // Amber Highlight
  totalValCell.alignment = { vertical: 'middle', horizontal: 'right' }
  totalValCell.border = {
    top: { style: 'medium', color: { argb: 'FFD97706' } },
    bottom: { style: 'double', color: { argb: 'FFD97706' } },
    left: { style: 'thin', color: { argb: 'FFD97706' } },
    right: { style: 'thin', color: { argb: 'FFD97706' } },
  }

  currentRowIndex += 2

  // 7. Notice Footer
  ws.mergeCells(`A${currentRowIndex}:E${currentRowIndex}`)
  const noticeCell = ws.getCell(`A${currentRowIndex}`)
  noticeCell.value = 'Notice to Customer: Please review and settle this pending credit statement. Thank you for your continued business!'
  noticeCell.font = { italic: true, color: { argb: 'FF6B7280' }, size: 9.5 }
  noticeCell.alignment = { vertical: 'middle', horizontal: 'center' }

  // Generate File Download
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `credit-bill-${customer.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
