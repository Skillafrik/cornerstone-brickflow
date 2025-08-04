import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Factory, Plus, Search, Edit2, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductionModuleProps {
  onBack: () => void;
}

interface ProductionOrder {
  id: string;
  product_id: string;
  planned_quantity: number;
  produced_quantity: number;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  products?: {
    name: string;
    type: string;
    unit: string;
  };
}

interface Product {
  id: string;
  name: string;
  type: string;
  unit: string;
}

const ProductionModule = ({ onBack }: ProductionModuleProps) => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_id: '',
    planned_quantity: '',
    start_date: '',
    end_date: '',
    status: 'planned' as 'planned' | 'in_progress' | 'completed' | 'cancelled',
    notes: ''
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('production_orders')
        .select(`
          *,
          products!fk_production_orders_product_id (
            name,
            type,
            unit
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading production orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ordres de production",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const orderData = {
        product_id: formData.product_id,
        planned_quantity: parseInt(formData.planned_quantity),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: formData.status,
        notes: formData.notes || null,
        produced_quantity: editingOrder?.produced_quantity || 0,
      };

      if (editingOrder) {
        const { error } = await (supabase as any)
          .from('production_orders')
          .update(orderData)
          .eq('id', editingOrder.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Ordre de production mis à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('production_orders')
          .insert(orderData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Ordre de production créé avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingOrder(null);
      setFormData({
        product_id: '',
        planned_quantity: '',
        start_date: '',
        end_date: '',
        status: 'planned',
        notes: ''
      });
      loadOrders();
    } catch (error) {
      console.error('Error saving production order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'ordre de production",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order);
    setFormData({
      product_id: order.product_id,
      planned_quantity: order.planned_quantity.toString(),
      start_date: order.start_date.split('T')[0],
      end_date: order.end_date ? order.end_date.split('T')[0] : '',
      status: order.status,
      notes: order.notes || ''
    });
    setIsDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: ProductionOrder['status']) => {
    try {
      const updateData: any = { status: newStatus };
      
      // If completing the order, set end_date
      if (newStatus === 'completed') {
        updateData.end_date = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('production_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Statut de l'ordre mis à jour",
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const updateProducedQuantity = async (orderId: string, producedQuantity: number) => {
    try {
      const { error } = await (supabase as any)
        .from('production_orders')
        .update({ produced_quantity: producedQuantity })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Quantité produite mise à jour",
      });
      
      loadOrders();
    } catch (error) {
      console.error('Error updating produced quantity:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la quantité",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.products?.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'planned': return 'Planifié';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getProgress = (planned: number, produced: number) => {
    if (planned === 0) return 0;
    return Math.min((produced / planned) * 100, 100);
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
              <Factory className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion de la Production</h1>
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
                placeholder="Rechercher un ordre..."
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
                Nouvel ordre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? 'Modifier l\'ordre' : 'Nouvel ordre de production'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product_id">Produit</Label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="planned_quantity">Quantité planifiée</Label>
                  <Input
                    id="planned_quantity"
                    type="number"
                    value={formData.planned_quantity}
                    onChange={(e) => setFormData({...formData, planned_quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin prévue</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planifié</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Instructions de production, remarques..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingOrder ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Production orders table */}
        <Card>
          <CardHeader>
            <CardTitle>Ordres de production</CardTitle>
            <CardDescription>
              Tous les ordres de production et leur avancement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantité planifiée</TableHead>
                    <TableHead>Quantité produite</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const progress = getProgress(order.planned_quantity, order.produced_quantity);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.products?.name}
                        </TableCell>
                        <TableCell>{order.products?.type}</TableCell>
                        <TableCell>
                          {order.planned_quantity} {order.products?.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{order.produced_quantity} {order.products?.unit}</span>
                            {order.status === 'in_progress' && (
                              <Input
                                type="number"
                                className="w-20 h-8"
                                defaultValue={order.produced_quantity}
                                onBlur={(e) => {
                                  const newQuantity = parseInt(e.target.value);
                                  if (newQuantity !== order.produced_quantity && newQuantity >= 0) {
                                    updateProducedQuantity(order.id, newQuantity);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{progress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(order.start_date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {order.end_date ? new Date(order.end_date).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {order.status === 'planned' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'in_progress')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === 'in_progress' && progress >= 100 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProductionModule;