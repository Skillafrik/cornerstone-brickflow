import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Mail } from 'lucide-react';
import cornerstoneLogo from '@/assets/cornerstone-logo.png';

interface InvoiceItem {
  designation: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceTemplateProps {
  invoiceNumber: string;
  clientName: string;
  clientAddress?: string;
  date: string;
  items: InvoiceItem[];
  taxRate?: number;
  onPrint?: () => void;
  onSend?: () => void;
}

const InvoiceTemplate = ({ 
  invoiceNumber, 
  clientName, 
  clientAddress, 
  date, 
  items, 
  taxRate = 18,
  onPrint,
  onSend 
}: InvoiceTemplateProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalTTC = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white text-black print:shadow-none" id="invoice">
      {/* Header with logo */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <img 
              src={cornerstoneLogo} 
              alt="Cornerstone Briques" 
              className="h-16 w-16 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">CORNERSTONE BRIQUES</h1>
              <p className="text-sm text-gray-600">21 Rue de Hertz, Akodesewaah BP: 2015<br/>Lomé - TOGO</p>
              <p className="text-sm text-gray-600">Tél: (228) 71 61 47 47<br/>Email: cornerstonebriques@gmail.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold mb-2">FACTURE</h2>
            <p className="text-sm"><strong>N°:</strong> {invoiceNumber}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Client info */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-bold mb-2">FACTURÉ À:</h3>
          <p className="font-medium">{clientName}</p>
          {clientAddress && <p className="text-sm text-gray-600">{clientAddress}</p>}
        </div>
      </div>

      {/* Invoice items table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Désignation</th>
              <th className="border border-gray-300 px-4 py-2 text-center">TVA</th>
              <th className="border border-gray-300 px-4 py-2 text-right">P.U HT</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Qté</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{item.designation}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{taxRate}%</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="border border-gray-300">
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span>Total HT:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span>TVA ({taxRate}%):</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 bg-gray-100 font-bold">
              <span>Total TTC:</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment terms */}
      <div className="border-t pt-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Conditions de règlement:</strong>
            <p>À réception</p>
          </div>
          <div>
            <strong>Mode de règlement:</strong>
            <p>Espèces</p>
          </div>
        </div>
      </div>

      {/* Action buttons - hidden in print */}
      <div className="mt-8 flex justify-center space-x-4 print:hidden">
        <Button onClick={onPrint} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Imprimer</span>
        </Button>
        <Button onClick={onSend} variant="outline" className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span>Envoyer</span>
        </Button>
      </div>
    </div>
  );
};

export default InvoiceTemplate;