import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockModuleProps {
  onBack: () => void;
}

interface StockItem {
  id: string;
  product_id: string;
  current_quantity: number;
  min_threshold: number;
  max_threshold: number;
  last_updated: string;
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

const StockModule = ({ onBack }: StockModuleProps) => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_id: '',
    current_quantity: '',
    min_threshold: '',
    max_threshold: ''
  });

  useEffect(() => {
    loadStock();
    loadProducts();
  }, []);

  const loadStock = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('stock')
        .select(`
          *,
          products (
            name,
            type,
            unit
          )
        `);

      if (error) throw error;
      setStock(data || []);
    } catch (error) {
      console.error('Error loading stock:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le stock",
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
      const stockData = {
        product_id: formData.product_id,
        current_quantity: parseInt(formData.current_quantity),
        min_threshold: parseInt(formData.min_threshold),
        max_threshold: parseInt(formData.max_threshold),
      };

      if (editingItem) {
        const { error } = await (supabase as any)
          .from('stock')
          .update(stockData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Stock mis à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('stock')
          .insert(stockData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Stock créé avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        product_id: '',
        current_quantity: '',
        min_threshold: '',
        max_threshold: ''
      });
      loadStock();
    } catch (error) {
      console.error('Error saving stock:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le stock",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      current_quantity: item.current_quantity.toString(),
      min_threshold: item.min_threshold.toString(),
      max_threshold: item.max_threshold.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément du stock ?')) return;

    try {
      const { error } = await (supabase as any)
        .from('stock')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Élément supprimé du stock",
      });
      
      loadStock();
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément",
        variant: "destructive",
      });
    }
  };

  const filteredStock = stock.filter(item =>
    item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.products?.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item: StockItem) => {
    if (item.current_quantity <= item.min_threshold) return 'danger';
    if (item.current_quantity >= item.max_threshold) return 'warning';
    return 'normal';
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
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion du Stock</h1>
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
                placeholder="Rechercher un produit..."
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
                Ajouter au stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Modifier le stock' : 'Ajouter au stock'}
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
                  <Label htmlFor="current_quantity">Quantité actuelle</Label>
                  <Input
                    id="current_quantity"
                    type="number"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({...formData, current_quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="min_threshold">Seuil minimum</Label>
                  <Input
                    id="min_threshold"
                    type="number"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({...formData, min_threshold: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_threshold">Seuil maximum</Label>
                  <Input
                    id="max_threshold"
                    type="number"
                    value={formData.max_threshold}
                    onChange={(e) => setFormData({...formData, max_threshold: e.target.value})}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingItem ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stock table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock actuel</CardTitle>
            <CardDescription>
              Liste de tous les produits en stock avec leurs niveaux
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
                    <TableHead>Quantité</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Seuil Min</TableHead>
                    <TableHead>Seuil Max</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.products?.name}
                        </TableCell>
                        <TableCell>{item.products?.type}</TableCell>
                        <TableCell>{item.current_quantity}</TableCell>
                        <TableCell>{item.products?.unit}</TableCell>
                        <TableCell>{item.min_threshold}</TableCell>
                        <TableCell>{item.max_threshold}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            status === 'danger' ? 'bg-red-100 text-red-800' :
                            status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {status === 'danger' ? 'Stock faible' :
                             status === 'warning' ? 'Stock élevé' :
                             'Normal'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

export default StockModule;