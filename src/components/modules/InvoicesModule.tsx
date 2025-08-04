import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Receipt, Plus, Search, Edit2, Eye, Download, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoicesModuleProps {
  onBack: () => void;
}

interface Invoice {
  id: string;
  sale_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  total_amount: number;
  tax_amount: number;
  notes?: string;
  sales?: {
    client_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    clients?: {
      name: string;
      email: string;
    };
    products?: {
      name: string;
      type: string;
    };
  };
}

interface Sale {
  id: string;
  client_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  clients?: {
    name: string;
    email: string;
  };
  products?: {
    name: string;
    type: string;
  };
}

const InvoicesModule = ({ onBack }: InvoicesModuleProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sale_id: '',
    due_date: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    tax_rate: '18',
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
    loadSales();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select(`
          *,
          sales!fk_invoices_sale_id (
            client_id,
            product_id,
            quantity,
            unit_price,
            clients!fk_sales_client_id (
              name,
              email
            ),
            products!fk_sales_product_id (
              name,
              type
            )
          )
        `)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('sales')
        .select(`
          *,
          clients!fk_sales_client_id (
            name,
            email
          ),
          products!fk_sales_product_id (
            name,
            type
          )
        `)
        .eq('status', 'completed');

      if (error) throw error;
      
      // Filter out sales that already have invoices
      const salesWithInvoices = invoices.map(inv => inv.sale_id);
      const availableSales = (data || []).filter(sale => !salesWithInvoices.includes(sale.id));
      
      setSales(availableSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FAC-${year}${month}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedSale = sales.find(sale => sale.id === formData.sale_id);
      if (!selectedSale) {
        toast({
          title: "Erreur",
          description: "Vente sélectionnée introuvable",
          variant: "destructive",
        });
        return;
      }

      const taxRate = parseFloat(formData.tax_rate) / 100;
      const taxAmount = selectedSale.total_amount * taxRate;
      const totalWithTax = selectedSale.total_amount + taxAmount;

      const invoiceData = {
        sale_id: formData.sale_id,
        invoice_number: editingInvoice?.invoice_number || generateInvoiceNumber(),
        issue_date: new Date().toISOString().split('T')[0],
        due_date: formData.due_date,
        status: formData.status,
        total_amount: totalWithTax,
        tax_amount: taxAmount,
        notes: formData.notes || null,
      };

      if (editingInvoice) {
        const { error } = await (supabase as any)
          .from('invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Facture mise à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('invoices')
          .insert(invoiceData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Facture créée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingInvoice(null);
      setFormData({
        sale_id: '',
        due_date: '',
        status: 'draft',
        tax_rate: '18',
        notes: ''
      });
      loadInvoices();
      loadSales();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la facture",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      sale_id: invoice.sale_id,
      due_date: invoice.due_date,
      status: invoice.status,
      tax_rate: ((invoice.tax_amount / (invoice.total_amount - invoice.tax_amount)) * 100).toFixed(0),
      notes: invoice.notes || ''
    });
    setIsDialogOpen(true);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      const { error } = await (supabase as any)
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Statut de la facture mis à jour",
      });
      
      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.sales?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'sent': return 'Envoyée';
      case 'draft': return 'Brouillon';
      case 'overdue': return 'En retard';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Receipt className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Factures</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brick">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle facture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? 'Modifier la facture' : 'Nouvelle facture'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingInvoice && (
                  <div>
                    <Label htmlFor="sale_id">Vente à facturer</Label>
                    <Select value={formData.sale_id} onValueChange={(value) => setFormData({...formData, sale_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une vente" />
                      </SelectTrigger>
                      <SelectContent>
                        {sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.clients?.name} - {sale.products?.name} - {formatCurrency(sale.total_amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="due_date">Date d'échéance</Label>
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
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notes sur la facture..."
                  />
                </div>
                {formData.sale_id && (
                  <div className="p-4 bg-muted rounded">
                    {(() => {
                      const selectedSale = sales.find(sale => sale.id === formData.sale_id);
                      if (!selectedSale) return null;
                      const taxRate = parseFloat(formData.tax_rate) / 100;
                      const taxAmount = selectedSale.total_amount * taxRate;
                      const totalWithTax = selectedSale.total_amount + taxAmount;
                      return (
                        <div className="text-sm space-y-1">
                          <p>Montant HT: {formatCurrency(selectedSale.total_amount)}</p>
                          <p>TVA ({formData.tax_rate}%): {formatCurrency(taxAmount)}</p>
                          <p className="font-medium">Total TTC: {formatCurrency(totalWithTax)}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingInvoice ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoices table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des factures</CardTitle>
            <CardDescription>
              Toutes les factures émises
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date émission</TableHead>
                    <TableHead>Date échéance</TableHead>
                    <TableHead>Montant HT</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{invoice.sales?.clients?.name}</TableCell>
                      <TableCell>
                        {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.total_amount - invoice.tax_amount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.tax_amount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(invoice)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'sent' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            >
                              Marquer payée
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvoicesModule;