import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InvoiceTemplate from './InvoiceTemplate';

interface Sale {
  id: string;
  client_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  payment_method?: string;
  clients?: {
    name: string;
    address?: string;
  };
  products?: {
    name: string;
    type: string;
  };
}

interface InvoiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onInvoiceCreated: () => void;
}

const InvoiceFormDialog = ({ isOpen, onClose, sale, onInvoiceCreated }: InvoiceFormDialogProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    due_date: '',
    tax_rate: '18',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (sale && isOpen) {
      // Set default due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setFormData({
        due_date: dueDate.toISOString().split('T')[0],
        tax_rate: '18',
        notes: ''
      });
    }
  }, [sale, isOpen]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FAC-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sale) return;

    try {
      const taxRate = parseFloat(formData.tax_rate) / 100;
      const taxAmount = sale.total_amount * taxRate;
      const totalWithTax = sale.total_amount + taxAmount;

      const invoiceData = {
        sale_id: sale.id,
        invoice_number: generateInvoiceNumber(),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: formData.due_date,
        status: 'draft',
        total_amount: totalWithTax,
        tax_amount: taxAmount,
        tax_rate: parseFloat(formData.tax_rate),
        notes: formData.notes || null,
      };

      const { error } = await (supabase as any)
        .from('invoices')
        .insert(invoiceData);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Facture créée avec succès",
      });

      onInvoiceCreated();
      onClose();
      
      // Show preview after creation
      setShowPreview(true);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la facture",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    toast({
      title: "Information",
      description: "Fonctionnalité d'envoi en cours de développement",
    });
  };

  if (!sale) return null;

  if (showPreview) {
    const taxRate = parseFloat(formData.tax_rate);
    const items = [{
      designation: `${sale.products?.name} (${sale.products?.type})`,
      quantity: sale.quantity,
      unitPrice: sale.unit_price,
      total: sale.total_amount
    }];

    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <InvoiceTemplate
            invoiceNumber={generateInvoiceNumber()}
            clientName={sale.clients?.name || ''}
            clientAddress={sale.clients?.address}
            date={new Date().toISOString()}
            items={items}
            taxRate={taxRate}
            onPrint={handlePrint}
            onSend={handleSend}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une facture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded">
            <h4 className="font-medium mb-2">Détails de la vente</h4>
            <p><strong>Client:</strong> {sale.clients?.name}</p>
            <p><strong>Produit:</strong> {sale.products?.name}</p>
            <p><strong>Quantité:</strong> {sale.quantity}</p>
            <p><strong>Montant:</strong> {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XOF',
              minimumFractionDigits: 0,
            }).format(sale.total_amount)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="due_date">Date d'échéance *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="tax_rate">Taux de TVA (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes additionnelles..."
              />
            </div>

            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm"><strong>Montant HT:</strong> {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(sale.total_amount)}</p>
              <p className="text-sm"><strong>TVA ({formData.tax_rate}%):</strong> {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(sale.total_amount * parseFloat(formData.tax_rate) / 100)}</p>
              <p className="font-medium"><strong>Total TTC:</strong> {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0,
              }).format(sale.total_amount * (1 + parseFloat(formData.tax_rate) / 100))}</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="gradient-brick">
                Créer la facture
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;