import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Target, Plus, Search, Edit2, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ObjectivesModuleProps {
  onBack: () => void;
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  category: 'production' | 'sales' | 'quality' | 'efficiency' | 'other';
}

const ObjectivesModule = ({ onBack }: ObjectivesModuleProps) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    unit: '',
    start_date: '',
    end_date: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
    category: 'production' as 'production' | 'sales' | 'quality' | 'efficiency' | 'other'
  });

  const categoryLabels = {
    production: 'Production',
    sales: 'Ventes',
    quality: 'Qualité',
    efficiency: 'Efficacité',
    other: 'Autre'
  };

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('objectives')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error loading objectives:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les objectifs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const objectiveData = {
        title: formData.title,
        description: formData.description || null,
        target_value: parseFloat(formData.target_value),
        current_value: editingObjective?.current_value || 0,
        unit: formData.unit,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        category: formData.category,
      };

      if (editingObjective) {
        const { error } = await (supabase as any)
          .from('objectives')
          .update(objectiveData)
          .eq('id', editingObjective.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Objectif mis à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('objectives')
          .insert(objectiveData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Objectif créé avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingObjective(null);
      setFormData({
        title: '',
        description: '',
        target_value: '',
        unit: '',
        start_date: '',
        end_date: '',
        status: 'active',
        category: 'production'
      });
      loadObjectives();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'objectif",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    setFormData({
      title: objective.title,
      description: objective.description || '',
      target_value: objective.target_value.toString(),
      unit: objective.unit,
      start_date: objective.start_date.split('T')[0],
      end_date: objective.end_date.split('T')[0],
      status: objective.status,
      category: objective.category
    });
    setIsDialogOpen(true);
  };

  const updateCurrentValue = async (objectiveId: string, newValue: number) => {
    try {
      const objective = objectives.find(obj => obj.id === objectiveId);
      if (!objective) return;

      const updateData: any = { current_value: newValue };
      
      // Auto-complete if target is reached
      if (newValue >= objective.target_value && objective.status === 'active') {
        updateData.status = 'completed';
      }

      const { error } = await (supabase as any)
        .from('objectives')
        .update(updateData)
        .eq('id', objectiveId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Progression mise à jour",
      });
      
      loadObjectives();
    } catch (error) {
      console.error('Error updating objective value:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la progression",
        variant: "destructive",
      });
    }
  };

  const updateObjectiveStatus = async (objectiveId: string, newStatus: Objective['status']) => {
    try {
      const { error } = await (supabase as any)
        .from('objectives')
        .update({ status: newStatus })
        .eq('id', objectiveId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Statut de l'objectif mis à jour",
      });
      
      loadObjectives();
    } catch (error) {
      console.error('Error updating objective status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const filteredObjectives = objectives.filter(objective =>
    objective.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoryLabels[objective.category]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'active': return 'Actif';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getObjectivesByCategory = () => {
    const categoryCounts: { [key: string]: { total: number, completed: number } } = {};
    objectives.forEach(objective => {
      if (!categoryCounts[objective.category]) {
        categoryCounts[objective.category] = { total: 0, completed: 0 };
      }
      categoryCounts[objective.category].total++;
      if (objective.status === 'completed') {
        categoryCounts[objective.category].completed++;
      }
    });
    return categoryCounts;
  };

  const categoryStats = getObjectivesByCategory();

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
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Gestion des Objectifs</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Objectives overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.length}</div>
              <p className="text-xs text-muted-foreground">objectifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {objectives.filter(obj => obj.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">en cours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {objectives.filter(obj => obj.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">réalisés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {objectives.length > 0 
                  ? ((objectives.filter(obj => obj.status === 'completed').length / objectives.length) * 100).toFixed(0)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground">de réussite</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progression moy.</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {objectives.length > 0 
                  ? (objectives.reduce((sum, obj) => sum + getProgress(obj.current_value, obj.target_value), 0) / objectives.length).toFixed(0)
                  : '0'
                }%
              </div>
              <p className="text-xs text-muted-foreground">moyenne</p>
            </CardContent>
          </Card>
        </div>

        {/* Category stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Objectifs par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(categoryLabels).map(([category, label]) => {
                const stats = categoryStats[category] || { total: 0, completed: 0 };
                const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                return (
                  <div key={category} className="text-center">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed} terminés ({completionRate.toFixed(0)}%)
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un objectif..."
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
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Titre de l'objectif"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description détaillée de l'objectif"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_value">Valeur cible</Label>
                    <Input
                      id="target_value"
                      type="number"
                      step="0.01"
                      value={formData.target_value}
                      onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unité</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="Ex: briques, FCFA, %"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingObjective ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Objectives table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des objectifs</CardTitle>
            <CardDescription>
              Tous les objectifs et leur progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Chargement...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Valeur actuelle</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObjectives.map((objective) => {
                    const progress = getProgress(objective.current_value, objective.target_value);
                    return (
                      <TableRow key={objective.id}>
                        <TableCell className="font-medium">
                          {objective.title}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {categoryLabels[objective.category]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  progress >= 100 ? 'bg-green-500' : 'bg-primary'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{progress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{objective.current_value} {objective.unit}</span>
                            {objective.status === 'active' && (
                              <Input
                                type="number"
                                className="w-20 h-8"
                                defaultValue={objective.current_value}
                                onBlur={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  if (newValue !== objective.current_value && newValue >= 0) {
                                    updateCurrentValue(objective.id, newValue);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {objective.target_value} {objective.unit}
                        </TableCell>
                        <TableCell>
                          {new Date(objective.end_date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(objective.status)}`}>
                            {getStatusText(objective.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(objective)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {objective.status === 'active' && progress >= 100 && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => updateObjectiveStatus(objective.id, 'completed')}
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

export default ObjectivesModule;