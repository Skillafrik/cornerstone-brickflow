import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, TrendingDown, Plus, Search, Edit2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LossesModuleProps {
  onBack: () => void;
}

interface Loss {
  id: string;
  product_id: string;
  quantity: number;
  loss_type: 'damage' | 'expiry' | 'theft' | 'other';
  loss_date: string;
  description?: string;
  value_lost: number;
  products?: {
    name: string;
    type: string;
    unit: string;
    price: number;
  };
}

interface Product {
  id: string;
  name: string;
  type: string;
  unit: string;
  price: number;
}

const LossesModule = ({ onBack }: LossesModuleProps) => {
  const [losses, setLosses] = useState<Loss[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoss, setEditingLoss] = useState<Loss | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    loss_type: 'damage' as 'damage' | 'expiry' | 'theft' | 'other',
    loss_date: '',
    description: ''
  });

  useEffect(() => {
    loadLosses();
    loadProducts();
  }, []);

  const loadLosses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('losses')
        .select(`
          *,
          products (
            name,
            type,
            unit,
            price
          )
        `)
        .order('loss_date', { ascending: false });

      if (error) throw error;
      setLosses(data || []);
    } catch (error) {
      console.error('Error loading losses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les pertes",
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
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (!selectedProduct) {
        toast({
          title: "Erreur",
          description: "Produit sélectionné introuvable",
          variant: "destructive",
        });
        return;
      }

      const quantity = parseInt(formData.quantity);
      const valueLost = quantity * selectedProduct.price;

      const lossData = {
        product_id: formData.product_id,
        quantity,
        loss_type: formData.loss_type,
        loss_date: formData.loss_date,
        description: formData.description || null,
        value_lost: valueLost,
      };

      if (editingLoss) {
        const { error } = await (supabase as any)
          .from('losses')
          .update(lossData)
          .eq('id', editingLoss.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Perte mise à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('losses')
          .insert(lossData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Perte enregistrée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingLoss(null);
      setFormData({
        product_id: '',
        quantity: '',
        loss_type: 'damage',
        loss_date: '',
        description: ''
      });
      loadLosses();
    } catch (error) {
      console.error('Error saving loss:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la perte",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (loss: Loss) => {
    setEditingLoss(loss);
    setFormData({
      product_id: loss.product_id,
      quantity: loss.quantity.toString(),
      loss_type: loss.loss_type,
      loss_date: loss.loss_date.split('T')[0],
      description: loss.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de perte ?')) return;

    try {
      const { error } = await (supabase as any)
        .from('losses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Perte supprimée",
      });
      
      loadLosses();
    } catch (error) {
      console.error('Error deleting loss:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la perte",
        variant: "destructive",
      });
    }
  };

  const filteredLosses = losses.filter(loss =>
    loss.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loss.loss_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getLossTypeColor = (type: string) => {
    switch (type) {
      case 'damage': return 'bg-red-100 text-red-800';
      case 'expiry': return 'bg-orange-100 text-orange-800';
      case 'theft': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLossTypeText = (type: string) => {
    switch (type) {
      case 'damage': return 'Dommage';
      case 'expiry': return 'Péremption';
      case 'theft': return 'Vol';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  const getTotalLossValue = () => {
    return filteredLosses.reduce((total, loss) => total + loss.value_lost, 0);
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
              <TrendingDown className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Pertes</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Summary card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Résumé des pertes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{filteredLosses.length}</p>
                <p className="text-sm text-muted-foreground">Incidents enregistrés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {filteredLosses.reduce((total, loss) => total + loss.quantity, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Unités perdues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getTotalLossValue())}</p>
                <p className="text-sm text-muted-foreground">Valeur perdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une perte..."
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
                Enregistrer une perte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLoss ? 'Modifier la perte' : 'Enregistrer une perte'}
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
                          {product.name} ({product.type}) - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantité perdue</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="loss_type">Type de perte</Label>
                  <Select value={formData.loss_type} onValueChange={(value: any) => setFormData({...formData, loss_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Dommage/Casse</SelectItem>
                      <SelectItem value="expiry">Péremption</SelectItem>
                      <SelectItem value="theft">Vol</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loss_date">Date de la perte</Label>
                  <Input
                    id="loss_date"
                    type="date"
                    value={formData.loss_date}
                    onChange={(e) => setFormData({...formData, loss_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Détails sur la cause de la perte..."
                  />
                </div>
                {formData.quantity && formData.product_id && (
                  <div className="p-4 bg-muted rounded">
                    {(() => {
                      const selectedProduct = products.find(p => p.id === formData.product_id);
                      if (!selectedProduct) return null;
                      const quantity = parseInt(formData.quantity || '0');
                      const valueLost = quantity * selectedProduct.price;
                      return (
                        <div className="text-sm">
                          <p>Produit: {selectedProduct.name}</p>
                          <p>Quantité: {quantity} {selectedProduct.unit}</p>
                          <p className="font-medium text-red-600">
                            Valeur perdue: {formatCurrency(valueLost)}
                          </p>
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
                    {editingLoss ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Losses table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des pertes</CardTitle>
            <CardDescription>
              Tous les incidents de perte enregistrés
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
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantité perdue</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Valeur perdue</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLosses.map((loss) => (
                    <TableRow key={loss.id}>
                      <TableCell>
                        {new Date(loss.loss_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {loss.products?.name}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getLossTypeColor(loss.loss_type)}`}>
                          {getLossTypeText(loss.loss_type)}
                        </span>
                      </TableCell>
                      <TableCell>{loss.quantity}</TableCell>
                      <TableCell>{loss.products?.unit}</TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(loss.value_lost)}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {loss.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(loss)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(loss.id)}>
                            <TrendingDown className="h-4 w-4" />
                          </Button>
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

export default LossesModule;