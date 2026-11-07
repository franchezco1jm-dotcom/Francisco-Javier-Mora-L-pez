import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Product } from '../types';

interface ExportReportOptions {
  products: Product[];
  globalInvestment: number;
  totalRetailValue: number;
  projectedNetProfit: number;
  totalSold: number;
  userName: string;
  isAdmin: boolean;
}

export function exportInventoryToExcel({
  products,
  globalInvestment,
  totalRetailValue,
  projectedNetProfit,
  totalSold,
  isAdmin,
}: ExportReportOptions) {
  if (products.length === 0) return false;

  const dataToExport = products.map((p, idx) => {
    const stock = Number(p.stock) || 0;
    const sold = Number(p.soldCount) || 0;
    const price = Number(p.price) || 0;
    const retailValue = stock * price;
    const totalCollected = sold * price;
    return {
      '#': idx + 1,
      'Código de Barras': p.barcode || 'N/A',
      'Producto': p.title,
      'Categoría': p.category || 'General',
      'Stock Disponible': stock,
      'Precio de Venta ($)': price.toFixed(2),
      'Valor Total en Stock ($)': retailValue.toFixed(2),
      'Unidades Vendidas': sold,
      'Total Cobrado en Ventas ($)': totalCollected.toFixed(2),
      'Estado': stock === 0 ? 'Agotado' : stock <= 3 ? 'Bajo Stock' : 'En Stock',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // If Admin, add summary rows
  if (isAdmin) {
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [],
        ['--- RESUMEN FINANCIERO GLOBAL ---'],
        ['Inversión Global Total ($)', globalInvestment.toFixed(2)],
        ['Valor Total en Venta del Stock ($)', totalRetailValue.toFixed(2)],
        ['Ganancia Neta Proyectada ($)', projectedNetProfit.toFixed(2)],
        ['Total Cobrado en Ventas ($)', totalSold.toFixed(2)],
      ],
      { origin: -1 }
    );
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Blackberry_Inventario_${dateStr}.xlsx`);
  return true;
}

export function exportInventoryToPDF({
  products,
  globalInvestment,
  totalRetailValue,
  projectedNetProfit,
  totalSold,
  userName,
  isAdmin,
}: ExportReportOptions) {
  if (products.length === 0) return false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dateFormatted = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Top header banner background (Blackberry deep purple)
  doc.setFillColor(15, 7, 26); // #0f071a
  doc.rect(0, 0, 210, 36, 'F');

  // Decorative accent line
  doc.setFillColor(147, 51, 234); // #9333ea
  doc.rect(0, 35, 210, 1.5, 'F');

  // App Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Blackberry Inventory', 14, 15);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(192, 132, 252); // #c084fc
  doc.text('Compra • Vende • Encuentra', 14, 21);

  // Report details on top right
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha: ${dateFormatted}`, 196, 14, { align: 'right' });
  doc.text(`Generado por: ${userName}`, 196, 19, { align: 'right' });
  doc.text(`Total Productos: ${products.length}`, 196, 24, { align: 'right' });

  let startY = 44;

  // If Admin, draw Financial Summary Cards
  if (isAdmin) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 182, 22, 3, 3, 'FD');

    // Box 1: Inversión
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INVERSIÓN GLOBAL', 20, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$${globalInvestment.toFixed(2)}`, 20, startY + 14);

    // Box 2: Valor en Venta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('VALOR EN VENTA', 65, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`$${totalRetailValue.toFixed(2)}`, 65, startY + 14);

    // Box 3: Ganancia Neta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('GANANCIA NETA', 110, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`${projectedNetProfit >= 0 ? '+' : ''}$${projectedNetProfit.toFixed(2)}`, 110, startY + 14);

    // Box 4: Total Cobrado
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL VENTAS', 155, startY + 6);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237); // purple
    doc.text(`$${totalSold.toFixed(2)}`, 155, startY + 14);

    startY += 28;
  }

  // Table Data
  const tableRows = products.map((p, idx) => {
    const stock = Number(p.stock) || 0;
    const price = Number(p.price) || 0;
    const sold = Number(p.soldCount) || 0;
    const totalVal = stock * price;

    let status = 'En Stock';
    if (stock === 0) status = 'Agotado';
    else if (stock <= 3) status = `Bajo (${stock})`;

    return [
      (idx + 1).toString(),
      p.barcode || '-',
      p.title,
      p.category || 'General',
      stock.toString(),
      `$${price.toFixed(2)}`,
      `$${totalVal.toFixed(2)}`,
      sold.toString(),
      status,
    ];
  });

  autoTable(doc, {
    startY,
    head: [['#', 'Código', 'Producto', 'Categoría', 'Stock', 'P. Venta', 'Total Stock', 'Vendidos', 'Estado']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237], // #7c3aed (Blackberry purple)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Blackberry Inventory — Página ${data.pageNumber} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Blackberry_Inventario_${dateStr}.pdf`);
  return true;
}
