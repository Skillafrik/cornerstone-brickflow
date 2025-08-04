import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, UserCheck, Plus, Search, Edit2, Eye, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientsModuleProps {
  onBack: () => void;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

interface ClientStats {
  total_spent: number;
  total_orders: number;
  last_order_date?: string;
}

const ClientsModule = ({ onBack }: ClientsModuleProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<{ [clientId: string]: ClientStats }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
      
      // Load stats for each client
      if (data) {
        await loadClientStats(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientStats = async (clientList: Client[]) => {
    try {
      const stats: { [clientId: string]: ClientStats } = {};
      
      for (const client of clientList) {
        const { data: sales, error } = await (supabase as any)
          .from('sales')
          .select('total_amount, sale_date')
          .eq('client_id', client.id)
          .eq('status', 'completed');

        if (error) {
          console.error(`Error loading stats for client ${client.id}:`, error);
          continue;
        }

        const totalSpent = (sales || []).reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalOrders = sales?.length || 0;
        const lastOrderDate = sales && sales.length > 0 
          ? sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0].sale_date
          : undefined;

        stats[client.id] = {
          total_spent: totalSpent,
          total_orders: totalOrders,
          last_order_date: lastOrderDate
        };
      }
      
      setClientStats(stats);
    } catch (error) {
      console.error('Error loading client stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      if (editingClient) {
        const { error } = await (supabase as any)
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Client mis à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('clients')
          .insert(clientData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Client créé avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le client",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await (supabase as any)
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Client supprimé",
      });
      
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le client",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalClientsValue = () => {
    return Object.values(clientStats).reduce((sum, stats) => sum + stats.total_spent, 0);
  };

  const getTopClients = () => {
    return filteredClients
      .map(client => ({ ...client, stats: clientStats[client.id] }))
      .sort((a, b) => (b.stats?.total_spent || 0) - (a.stats?.total_spent || 0))
      .slice(0, 5);
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
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Clients</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Client overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">clients enregistrés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires total</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalClientsValue())}
              </div>
              <p className="text-xs text-muted-foreground">depuis le début</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {clients.length > 0 
                  ? formatCurrency(getTotalClientsValue() / clients.length)
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-muted-foreground">par client</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Object.values(clientStats).filter(stats => stats.total_orders > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">avec commandes</p>
            </CardContent>
          </Card>
        </div>

        {/* Top clients */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 5 Clients</CardTitle>
            <CardDescription>Clients avec le plus gros chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopClients().map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.stats?.total_orders || 0} commande(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(client.stats?.total_spent || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.stats?.last_order_date 
                        ? new Date(client.stats.last_order_date).toLocaleDateString('fr-FR')
                        : 'Aucune commande'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
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
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Modifier le client' : 'Nouveau client'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Adresse complète du client"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingClient ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client details dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du client</DialogTitle>
            </DialogHeader>
            {viewingClient && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <p className="font-medium">{viewingClient.name}</p>
                  </div>
                  <div>
                    <Label>Date d'inscription</Label>
                    <p className="font-medium">
                      {new Date(viewingClient.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{viewingClient.email || '-'}</p>
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <p className="font-medium">{viewingClient.phone || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Adresse</Label>
                  <p className="font-medium">{viewingClient.address || '-'}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(clientStats[viewingClient.id]?.total_spent || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total dépensé</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {clientStats[viewingClient.id]?.total_orders || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {clientStats[viewingClient.id]?.total_orders > 0
                        ? formatCurrency((clientStats[viewingClient.id]?.total_spent || 0) / (clientStats[viewingClient.id]?.total_orders || 1))
                        : formatCurrency(0)
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Panier moyen</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Clients table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
            <CardDescription>
              Tous les clients enregistrés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total dépensé</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Dernière commande</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const stats = clientStats[client.id];
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span className="text-sm">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(stats?.total_spent || 0)}
                        </TableCell>
                        <TableCell>{stats?.total_orders || 0}</TableCell>
                        <TableCell>
                          {stats?.last_order_date 
                            ? new Date(stats.last_order_date).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleView(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                              <Edit2 className="h-4 w-4" />
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

export default ClientsModule;