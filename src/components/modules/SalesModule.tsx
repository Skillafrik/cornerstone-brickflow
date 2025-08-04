import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ShoppingCart, Plus, Search, Edit2, Trash2, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InvoiceFormDialog from './InvoiceFormDialog';

interface SalesModuleProps {
  onBack: () => void;
}

interface Sale {
  id: string;
  client_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'cancelled';
  clients?: {
    name: string;
    email?: string;
    address?: string;
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

const SalesModule = ({ onBack }: SalesModuleProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [invoiceDialogSale, setInvoiceDialogSale] = useState<Sale | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_email: '',
    client_address: '',
    client_phone: '',
    payment_method: '',
    product_id: '',
    quantity: '',
    unit_price: '',
    status: 'pending' as 'pending' | 'completed' | 'cancelled'
  });

  useEffect(() => {
    loadSales();
    loadClients();
    loadProducts();
  }, []);

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
            type,
            unit
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes",
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

      let clientId = formData.client_id;

      // If no existing client selected and manual data provided, create new client
      if (!clientId && formData.client_name) {
        const { data: newClient, error: clientError } = await (supabase as any)
          .from('clients')
          .insert({
            name: formData.client_name,
            email: formData.client_email || null,
            address: formData.client_address || null,
            phone: formData.client_phone || null,
            notes: `Mode de règlement: ${formData.payment_method || 'Non spécifié'}`
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const saleData = {
        client_id: clientId,
        product_id: formData.product_id,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        status: formData.status,
        sale_date: new Date().toISOString(),
        notes: formData.payment_method ? `Mode de règlement: ${formData.payment_method}` : null
      };

      if (editingSale) {
        const { error } = await (supabase as any)
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Vente mise à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('sales')
          .insert(saleData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Vente créée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingSale(null);
      setFormData({
        client_id: '',
        client_name: '',
        client_email: '',
        client_address: '',
        client_phone: '',
        payment_method: '',
        product_id: '',
        quantity: '',
        unit_price: '',
        status: 'pending'
      });
      loadSales();
      loadClients(); // Refresh clients list
    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la vente",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      client_id: sale.client_id,
      client_name: '',
      client_email: '',
      client_address: '',
      client_phone: '',
      payment_method: '',
      product_id: sale.product_id,
      quantity: sale.quantity.toString(),
      unit_price: sale.unit_price.toString(),
      status: sale.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) return;

    try {
      const { error } = await (supabase as any)
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Vente supprimée",
      });
      
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (sale: Sale) => {
    setInvoiceDialogSale(sale);
    setIsInvoiceDialogOpen(true);
  };

  const handleInvoiceCreated = () => {
    // Optionally reload sales or update status
    loadSales();
  };

  const filteredSales = sales.filter(sale =>
    sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'pending': return 'En attente';
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
              <ShoppingCart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Ventes</h1>
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
                placeholder="Rechercher une vente..."
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
                Nouvelle vente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSale ? 'Modifier la vente' : 'Nouvelle vente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="client_id">Client existant (optionnel)</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ou sélectionner un client existant" />
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
                
                {!formData.client_id && (
                  <>
                    <div>
                      <Label htmlFor="client_name">Nom du client *</Label>
                      <Input
                        id="client_name"
                        value={formData.client_name}
                        onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                        placeholder="Nom complet du client"
                        required={!formData.client_id}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_email">Email du client</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                        placeholder="email@exemple.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_address">Adresse du client</Label>
                      <Input
                        id="client_address"
                        value={formData.client_address}
                        onChange={(e) => setFormData({...formData, client_address: e.target.value})}
                        placeholder="Adresse complète"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client_phone">Téléphone du client</Label>
                      <Input
                        id="client_phone"
                        value={formData.client_phone}
                        onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                     <div>
                       <Label htmlFor="payment_method">Mode de règlement *</Label>
                       <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})} required>
                         <SelectTrigger>
                           <SelectValue placeholder="Sélectionner le mode de règlement" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="cash">Espèces</SelectItem>
                           <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                           <SelectItem value="check">Chèque</SelectItem>
                           <SelectItem value="mobile_money">Mobile Money</SelectItem>
                           <SelectItem value="credit">À crédit</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                  </>
                )}
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
                          {product.name} ({product.type}) - {formatCurrency(product.price)}
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
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {editingSale ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des ventes</CardTitle>
            <CardDescription>
              Toutes les ventes enregistrées
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
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {new Date(sale.sale_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.clients?.name}
                      </TableCell>
                      <TableCell>{sale.products?.name}</TableCell>
                      <TableCell>{sale.quantity} {sale.products?.unit}</TableCell>
                      <TableCell>{formatCurrency(sale.unit_price)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(sale.status)}`}>
                          {getStatusText(sale.status)}
                        </span>
                      </TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(sale)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleDelete(sale.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                           {sale.status === 'completed' && (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => handleCreateInvoice(sale)}
                               className="text-green-600 hover:text-green-700"
                             >
                               <Receipt className="h-4 w-4" />
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

        {/* Invoice Form Dialog */}
        <InvoiceFormDialog
          isOpen={isInvoiceDialogOpen}
          onClose={() => setIsInvoiceDialogOpen(false)}
          sale={invoiceDialogSale}
          onInvoiceCreated={handleInvoiceCreated}
        />
      </main>
    </div>
  );
};

export default SalesModule;