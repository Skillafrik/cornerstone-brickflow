import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Plus, Search, Edit2, Eye, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuotationsModuleProps {
  onBack: () => void;
}

interface Quotation {
  id: string;
  client_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  created_at: string;
  clients?: {
    name: string;
    email: string;
  };
  products?: {
    name: string;
    type: string;
    unit: string;
  };
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  type: string;
  unit: string;
  price: number;
}

const QuotationsModule = ({ onBack }: QuotationsModuleProps) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: '',
    product_id: '',
    quantity: '',
    unit_price: '',
    valid_until: '',
    status: 'draft' as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired',
    notes: ''
  });

  useEffect(() => {
    loadQuotations();
    loadClients();
    loadProducts();
  }, []);

  const loadQuotations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quotations')
        .select(`
          *,
          clients!fk_quotations_client_id (
            name,
            email
          ),
          products!fk_quotations_product_id (
            name,
            type,
            unit
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les devis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('*');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const quantity = parseInt(formData.quantity);
      const unitPrice = parseFloat(formData.unit_price);
      const totalAmount = quantity * unitPrice;

      const quotationData = {
        client_id: formData.client_id,
        product_id: formData.product_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        valid_until: formData.valid_until,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingQuotation) {
        const { error } = await (supabase as any)
          .from('quotations')
          .update(quotationData)
          .eq('id', editingQuotation.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Devis mis à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('quotations')
          .insert(quotationData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Devis créé avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingQuotation(null);
      setFormData({
        client_id: '',
        product_id: '',
        quantity: '',
        unit_price: '',
        valid_until: '',
        status: 'draft',
        notes: ''
      });
      loadQuotations();
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le devis",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      client_id: quotation.client_id,
      product_id: quotation.product_id,
      quantity: quotation.quantity.toString(),
      unit_price: quotation.unit_price.toString(),
      valid_until: quotation.valid_until.split('T')[0],
      status: quotation.status,
      notes: quotation.notes || ''
    });
    setIsDialogOpen(true);
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepté';
      case 'sent': return 'Envoyé';
      case 'draft': return 'Brouillon';
      case 'rejected': return 'Rejeté';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  const convertToSale = async (quotation: Quotation) => {
    try {
      const saleData = {
        client_id: quotation.client_id,
        product_id: quotation.product_id,
        quantity: quotation.quantity,
        unit_price: quotation.unit_price,
        total_amount: quotation.total_amount,
        status: 'pending',
        sale_date: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('sales')
        .insert(saleData);

      if (error) throw error;

      // Update quotation status
      await (supabase as any)
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', quotation.id);

      toast({
        title: "Succès",
        description: "Devis converti en vente avec succès",
      });

      loadQuotations();
    } catch (error) {
      console.error('Error converting quotation to sale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de convertir le devis en vente",
        variant: "destructive",
      });
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
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Devis</h1>
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
                placeholder="Rechercher un devis..."
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
                Nouveau devis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingQuotation ? 'Modifier le devis' : 'Nouveau devis'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="client_id">Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product_id">Produit</Label>
                  <Select value={formData.product_id} onValueChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setFormData({
                      ...formData, 
                      product_id: value,
                      unit_price: product?.price?.toString() || ''
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Prix unitaire (FCFA)</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valable jusqu'au</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
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
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="accepted">Accepté</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Remarques ou conditions particulières..."
                  />
                </div>
                {formData.quantity && formData.unit_price && (
                  <div className="p-4 bg-muted rounded">
                    <p className="text-sm font-medium">
                      Total: {formatCurrency(parseInt(formData.quantity || '0') * parseFloat(formData.unit_price || '0'))}
                    </p>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingQuotation ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quotations table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des devis</CardTitle>
            <CardDescription>
              Tous les devis créés et leur statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valable jusqu'au</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell>
                        {new Date(quotation.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {quotation.clients?.name}
                      </TableCell>
                      <TableCell>{quotation.products?.name}</TableCell>
                      <TableCell>{quotation.quantity} {quotation.products?.unit}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quotation.total_amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(quotation.valid_until).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quotation.status)}`}>
                          {getStatusText(quotation.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(quotation)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {quotation.status === 'sent' && (
                            <Button variant="outline" size="sm" onClick={() => convertToSale(quotation)}>
                              Convertir en vente
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

export default QuotationsModule;