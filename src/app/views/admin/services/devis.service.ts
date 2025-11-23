import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class DevisService {

  private htmlContent = '';

  constructor() { }

  setHtmlContent(content: string) {
    this.htmlContent = content;
  }

  getHtmlContent(): string {
    return this.htmlContent;
  }

  downloadPDF() {
    const invoiceElement = document.getElementById('invoice');
    if (invoiceElement) {
      html2canvas(invoiceElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Calculate position to center the image
        const position = 0; // Change this to desired starting position

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        pdf.save('facture.pdf');
      }).catch(error => {
        console.error('Error generating canvas: ', error);
      });
    } else {
      console.error('Invoice element not found');
    }
  }
}
