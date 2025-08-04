import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Truck, Plus, Search, Edit2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveriesModuleProps {
  onBack: () => void;
}

interface Delivery {
  id: string;
  sale_id: string;
  delivery_date: string;
  delivery_address: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'failed';
  driver_name?: string;
  vehicle_info?: string;
  notes?: string;
  sales?: {
    client_id: string;
    product_id: string;
    quantity: number;
    clients?: {
      name: string;
      email: string;
      address?: string;
    };
    products?: {
      name: string;
      type: string;
      unit: string;
    };
  };
}

interface Sale {
  id: string;
  client_id: string;
  product_id: string;
  quantity: number;
  clients?: {
    name: string;
    email: string;
    address?: string;
  };
  products?: {
    name: string;
    type: string;
    unit: string;
  };
}

const DeliveriesModule = ({ onBack }: DeliveriesModuleProps) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sale_id: '',
    delivery_date: '',
    delivery_address: '',
    status: 'scheduled' as 'scheduled' | 'in_transit' | 'delivered' | 'failed',
    driver_name: '',
    vehicle_info: '',
    notes: ''
  });

  useEffect(() => {
    loadDeliveries();
    loadSales();
  }, []);

  const loadDeliveries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('deliveries')
        .select(`
          *,
          sales!fk_deliveries_sale_id (
            client_id,
            product_id,
            quantity,
            clients!fk_sales_client_id (
              name,
              email,
              address
            ),
            products!fk_sales_product_id (
              name,
              type,
              unit
            )
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les livraisons",
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
            email,
            address
          ),
          products!fk_sales_product_id (
            name,
            type,
            unit
          )
        `)
        .eq('status', 'completed');

      if (error) throw error;
      
      // Filter out sales that already have deliveries
      const salesWithDeliveries = deliveries.map(del => del.sale_id);
      const availableSales = (data || []).filter(sale => !salesWithDeliveries.includes(sale.id));
      
      setSales(availableSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const deliveryData = {
        sale_id: formData.sale_id,
        delivery_date: formData.delivery_date,
        delivery_address: formData.delivery_address,
        status: formData.status,
        driver_name: formData.driver_name || null,
        vehicle_info: formData.vehicle_info || null,
        notes: formData.notes || null,
      };

      if (editingDelivery) {
        const { error } = await (supabase as any)
          .from('deliveries')
          .update(deliveryData)
          .eq('id', editingDelivery.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Livraison mise à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('deliveries')
          .insert(deliveryData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Livraison programmée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingDelivery(null);
      setFormData({
        sale_id: '',
        delivery_date: '',
        delivery_address: '',
        status: 'scheduled',
        driver_name: '',
        vehicle_info: '',
        notes: ''
      });
      loadDeliveries();
      loadSales();
    } catch (error) {
      console.error('Error saving delivery:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la livraison",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setFormData({
      sale_id: delivery.sale_id,
      delivery_date: delivery.delivery_date.split('T')[0],
      delivery_address: delivery.delivery_address,
      status: delivery.status,
      driver_name: delivery.driver_name || '',
      vehicle_info: delivery.vehicle_info || '',
      notes: delivery.notes || ''
    });
    setIsDialogOpen(true);
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      const { error } = await (supabase as any)
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', deliveryId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Statut de la livraison mis à jour",
      });
      
      loadDeliveries();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.sales?.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Livrée';
      case 'in_transit': return 'En transit';
      case 'scheduled': return 'Programmée';
      case 'failed': return 'Échouée';
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
              <Truck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Livraisons</h1>
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
                placeholder="Rechercher une livraison..."
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
                Nouvelle livraison
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDelivery ? 'Modifier la livraison' : 'Nouvelle livraison'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingDelivery && (
                  <div>
                    <Label htmlFor="sale_id">Vente à livrer</Label>
                    <Select 
                      value={formData.sale_id} 
                      onValueChange={(value) => {
                        const selectedSale = sales.find(sale => sale.id === value);
                        setFormData({
                          ...formData, 
                          sale_id: value,
                          delivery_address: selectedSale?.clients?.address || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une vente" />
                      </SelectTrigger>
                      <SelectContent>
                        {sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.clients?.name} - {sale.products?.name} ({sale.quantity} {sale.products?.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="delivery_date">Date de livraison</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_address">Adresse de livraison</Label>
                  <Textarea
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    placeholder="Adresse complète de livraison..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="driver_name">Nom du chauffeur</Label>
                  <Input
                    id="driver_name"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                    placeholder="Nom du chauffeur"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_info">Informations véhicule</Label>
                  <Input
                    id="vehicle_info"
                    value={formData.vehicle_info}
                    onChange={(e) => setFormData({...formData, vehicle_info: e.target.value})}
                    placeholder="Marque, modèle, plaque d'immatriculation..."
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Programmée</SelectItem>
                      <SelectItem value="in_transit">En transit</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="failed">Échouée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Instructions spéciales, remarques..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingDelivery ? 'Modifier' : 'Programmer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Deliveries table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des livraisons</CardTitle>
            <CardDescription>
              Toutes les livraisons programmées et effectuées
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
                    <TableHead>Adresse</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {new Date(delivery.delivery_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {delivery.sales?.clients?.name}
                      </TableCell>
                      <TableCell>{delivery.sales?.products?.name}</TableCell>
                      <TableCell>
                        {delivery.sales?.quantity} {delivery.sales?.products?.unit}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {delivery.delivery_address}
                      </TableCell>
                      <TableCell>{delivery.driver_name || '-'}</TableCell>
                      <TableCell>{delivery.vehicle_info || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(delivery.status)}`}>
                          {getStatusText(delivery.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(delivery)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MapPin className="h-4 w-4" />
                          </Button>
                          {delivery.status === 'scheduled' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            >
                              Démarrer
                            </Button>
                          )}
                          {delivery.status === 'in_transit' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                            >
                              Livré
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

export default DeliveriesModule;