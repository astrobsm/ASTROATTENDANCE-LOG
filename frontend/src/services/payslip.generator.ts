import jsPDF from 'jspdf';
import { Payslip, APP_CONSTANTS } from '../types';

/**
 * Format currency in Nigerian Naira
 */
function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format month string to readable format
 */
function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

/**
 * Format date to readable format
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate a PDF payslip
 */
export function generatePayslipPDF(payslip: Payslip): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [30, 64, 175]; // Astro blue
  const textColor: [number, number, number] = [15, 23, 42]; // Dark slate
  const lightGray: [number, number, number] = [241, 245, 249];

  let yPos = 20;

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_CONSTANTS.EMPLOYER_NAME, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Pay period
  doc.setFontSize(10);
  doc.text(`Pay Period: ${formatMonth(payslip.month)}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;

  // Reset text color
  doc.setTextColor(...textColor);

  // Employee Information Section
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE INFORMATION', 20, yPos + 6);
  yPos += 15;

  // Employee details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const leftCol = 20;
  const rightCol = pageWidth / 2 + 10;
  const lineHeight = 7;

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payslip.staffName, leftCol + 35, yPos);

  // Right column
  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payslip.staffId, rightCol + 30, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', leftCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payslip.department, leftCol + 28, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Role:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(payslip.role, rightCol + 15, yPos);
  yPos += 15;

  // Earnings Section
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, pageWidth - 30, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EARNINGS SUMMARY', 20, yPos + 6);
  yPos += 15;

  // Earnings table header
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, yPos + 6);
  doc.text('Hours/Rate', pageWidth / 2, yPos + 6, { align: 'center' });
  doc.text('Amount', pageWidth - 30, yPos + 6, { align: 'right' });
  yPos += 12;

  // Reset text color
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  // Hours worked row
  doc.text('Total Hours Worked', 25, yPos);
  doc.text(`${payslip.totalHours.toFixed(2)} hrs`, pageWidth / 2, yPos, { align: 'center' });
  doc.text('-', pageWidth - 30, yPos, { align: 'right' });
  yPos += lineHeight;

  // Hourly rate row
  doc.text('Hourly Rate', 25, yPos);
  doc.text('-', pageWidth / 2, yPos, { align: 'center' });
  doc.text(formatCurrency(payslip.hourlyRate), pageWidth - 30, yPos, { align: 'right' });
  yPos += lineHeight;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 5;

  // Gross Pay row (highlighted)
  doc.setFillColor(236, 253, 245);
  doc.rect(20, yPos - 3, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GROSS PAY', 25, yPos + 4);
  doc.text(formatCurrency(payslip.grossPay), pageWidth - 30, yPos + 4, { align: 'right' });
  yPos += 20;

  // Calculation breakdown
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(107, 114, 128);
  doc.text(
    `Calculation: ${payslip.totalHours.toFixed(2)} hours × ${formatCurrency(payslip.hourlyRate)}/hour = ${formatCurrency(payslip.grossPay)}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 20;

  // Net Pay Section (same as gross for v1 - no deductions)
  doc.setTextColor(...textColor);
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NET PAY', 25, yPos + 10);
  doc.text(formatCurrency(payslip.grossPay), pageWidth - 30, yPos + 10, { align: 'right' });
  yPos += 30;

  // Footer information
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const footerY = doc.internal.pageSize.getHeight() - 30;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);
  
  doc.text(`Generated on: ${formatDate(payslip.generatedAt)}`, 20, footerY);
  doc.text(`Document ID: ${payslip.id}`, 20, footerY + 5);
  doc.text(
    'This is an official payslip generated by AstroBSM Attendance Log System.',
    pageWidth / 2,
    footerY + 12,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Payslip_${payslip.staffId}_${payslip.month}.pdf`;
  doc.save(filename);
}

/**
 * Generate payslip data URL for preview
 */
export function generatePayslipDataURL(payslip: Payslip): string {
  const doc = new jsPDF();
  // Use same generation logic as above but return data URL
  // (simplified for brevity - in production, extract common logic)
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [30, 64, 175];
  
  let yPos = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_CONSTANTS.EMPLOYER_NAME, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(12);
  doc.text('OFFICIAL PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(10);
  doc.text(`Pay Period: ${formatMonth(payslip.month)}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 30;

  // Employee info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Employee: ${payslip.staffName}`, 20, yPos);
  yPos += 7;
  doc.text(`ID: ${payslip.staffId}`, 20, yPos);
  yPos += 7;
  doc.text(`Department: ${payslip.department}`, 20, yPos);
  yPos += 7;
  doc.text(`Role: ${payslip.role}`, 20, yPos);
  yPos += 15;

  // Earnings
  doc.text(`Total Hours: ${payslip.totalHours.toFixed(2)}`, 20, yPos);
  yPos += 7;
  doc.text(`Hourly Rate: ${formatCurrency(payslip.hourlyRate)}`, 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Gross Pay: ${formatCurrency(payslip.grossPay)}`, 20, yPos);

  return doc.output('datauristring');
}
