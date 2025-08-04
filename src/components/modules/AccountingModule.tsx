import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calculator, Plus, Search, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountingModuleProps {
  onBack: () => void;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method?: string;
  notes?: string;
}

const AccountingModule = ({ onBack }: AccountingModuleProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: '',
    payment_method: '',
    notes: ''
  });

  const expenseCategories = [
    'Matières premières',
    'Salaires',
    'Transport',
    'Électricité',
    'Maintenance',
    'Carburant',
    'Assurance',
    'Taxes',
    'Marketing',
    'Fournitures',
    'Autre'
  ];

  useEffect(() => {
    loadExpenses();
    loadRevenue();
  }, [selectedPeriod]);

  const getPeriodDates = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  const loadExpenses = async () => {
    try {
      const { startDate, endDate } = getPeriodDates();
      
      const { data, error } = await (supabase as any)
        .from('expenses')
        .select('*')
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0])
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRevenue = async () => {
    try {
      const { startDate, endDate } = getPeriodDates();
      
      const { data, error } = await (supabase as any)
        .from('sales')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('sale_date', startDate.toISOString().split('T')[0])
        .lte('sale_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      
      const totalRevenue = (data || []).reduce((sum, sale) => sum + sale.total_amount, 0);
      setRevenue(totalRevenue);
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        expense_date: formData.expense_date,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      if (editingExpense) {
        const { error } = await (supabase as any)
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Dépense mise à jour avec succès",
        });
      } else {
        const { error } = await (supabase as any)
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Dépense enregistrée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        category: '',
        expense_date: '',
        payment_method: '',
        notes: ''
      });
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la dépense",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      expense_date: expense.expense_date.split('T')[0],
      payment_method: expense.payment_method || '',
      notes: expense.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await (supabase as any)
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Dépense supprimée",
      });
      
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la dépense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getNetProfit = () => {
    return revenue - getTotalExpenses();
  };

  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current_month': return 'Ce mois';
      case 'last_month': return 'Mois dernier';
      case 'current_year': return 'Cette année';
      default: return 'Période sélectionnée';
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
              <Calculator className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Comptabilité</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="period">Période:</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Ce mois</SelectItem>
                  <SelectItem value="last_month">Mois dernier</SelectItem>
                  <SelectItem value="current_year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Financial overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(getTotalExpenses())}</div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénéfice net</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(getNetProfit())}
              </div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marge bénéficiaire</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue > 0 ? ((getNetProfit() / revenue) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Expense categories */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 5 Catégories de dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getExpensesByCategory().map(([category, amount]) => {
                const percentage = getTotalExpenses() > 0 ? (amount / getTotalExpenses()) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(amount)}
                      </span>
                    </div>
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
                placeholder="Rechercher une dépense..."
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
                Nouvelle dépense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description de la dépense"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expense_date">Date de dépense</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Mode de paiement</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Notes supplémentaires..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="gradient-brick">
                    {editingExpense ? 'Modifier' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expenses table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des dépenses</CardTitle>
            <CardDescription>
              Toutes les dépenses pour {getPeriodLabel().toLowerCase()}
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
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode de paiement</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>{expense.payment_method || '-'}</TableCell>
                      <TableCell className="max-w-32 truncate">
                        {expense.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)}>
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

export default AccountingModule;