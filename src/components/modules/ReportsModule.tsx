import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportsModuleProps {
  onBack: () => void;
}

interface SalesData {
  total_revenue: number;
  total_sales: number;
  avg_order_value: number;
}

interface ProductionData {
  total_produced: number;
  production_orders: number;
  efficiency_rate: number;
}

interface StockData {
  total_products: number;
  low_stock_items: number;
  total_value: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  production: number;
  expenses: number;
}

const ReportsModule = ({ onBack }: ReportsModuleProps) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [salesData, setSalesData] = useState<SalesData>({ total_revenue: 0, total_sales: 0, avg_order_value: 0 });
  const [productionData, setProductionData] = useState<ProductionData>({ total_produced: 0, production_orders: 0, efficiency_rate: 0 });
  const [stockData, setStockData] = useState<StockData>({ total_products: 0, low_stock_items: 0, total_value: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
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
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
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

  const loadReportData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSalesData(),
        loadProductionData(),
        loadStockData(),
        loadMonthlyData()
      ]);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du rapport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalesData = async () => {
    const { startDate, endDate } = getPeriodDates();
    
    const { data: sales, error } = await (supabase as any)
      .from('sales')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    const totalRevenue = (sales || []).reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalSales = sales?.length || 0;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    setSalesData({ total_revenue: totalRevenue, total_sales: totalSales, avg_order_value: avgOrderValue });
  };

  const loadProductionData = async () => {
    const { startDate, endDate } = getPeriodDates();
    
    const { data: orders, error } = await (supabase as any)
      .from('production_orders')
      .select('planned_quantity, produced_quantity')
      .gte('start_date', startDate.toISOString().split('T')[0])
      .lte('start_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    const totalProduced = (orders || []).reduce((sum, order) => sum + order.produced_quantity, 0);
    const totalPlanned = (orders || []).reduce((sum, order) => sum + order.planned_quantity, 0);
    const productionOrders = orders?.length || 0;
    const efficiencyRate = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;

    setProductionData({ total_produced: totalProduced, production_orders: productionOrders, efficiency_rate: efficiencyRate });
  };

  const loadStockData = async () => {
      const { data: stock, error } = await (supabase as any)
        .from('stock')
        .select(`
          quantity,
          minimum_stock,
          products!fk_stock_product_id (
            price
          )
        `);

    if (error) throw error;

    const totalProducts = stock?.length || 0;
    const lowStockItems = (stock || []).filter(item => item.quantity <= item.minimum_stock).length;
    const totalValue = (stock || []).reduce((sum, item) => sum + (item.quantity * (item.products?.price || 0)), 0);

    setStockData({ total_products: totalProducts, low_stock_items: lowStockItems, total_value: totalValue });
  };

  const loadMonthlyData = async () => {
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Sales data
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('sale_date', startDate.toISOString().split('T')[0])
        .lte('sale_date', endDate.toISOString().split('T')[0]);
      
      // Production data
      const { data: production } = await (supabase as any)
        .from('production_orders')
        .select('produced_quantity')
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0]);
      
      // Expenses data
      const { data: expenses } = await (supabase as any)
        .from('expenses')
        .select('amount')
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .lte('expense_date', endDate.toISOString().split('T')[0]);
      
      const salesTotal = (sales || []).reduce((sum, sale) => sum + sale.total_amount, 0);
      const productionTotal = (production || []).reduce((sum, order) => sum + order.produced_quantity, 0);
      const expensesTotal = (expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
      
      last6Months.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        sales: salesTotal,
        production: productionTotal,
        expenses: expensesTotal
      });
    }
    
    setMonthlyData(last6Months);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current_month': return 'Ce mois';
      case 'last_month': return 'Mois dernier';
      case 'current_quarter': return 'Ce trimestre';
      case 'current_year': return 'Cette année';
      default: return 'Période sélectionnée';
    }
  };

  const exportReport = () => {
    // Simple CSV export
    const csvData = [
      ['Indicateur', 'Valeur'],
      ['Chiffre d\'affaires', formatCurrency(salesData.total_revenue)],
      ['Nombre de ventes', salesData.total_sales.toString()],
      ['Panier moyen', formatCurrency(salesData.avg_order_value)],
      ['Production totale', productionData.total_produced.toString()],
      ['Ordres de production', productionData.production_orders.toString()],
      ['Taux d\'efficacité', `${productionData.efficiency_rate.toFixed(1)}%`],
      ['Produits en stock', stockData.total_products.toString()],
      ['Articles en rupture', stockData.low_stock_items.toString()],
      ['Valeur du stock', formatCurrency(stockData.total_value)]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Succès",
      description: "Rapport exporté avec succès",
    });
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
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Rapports et Analyses</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Ce mois</SelectItem>
                  <SelectItem value="last_month">Mois dernier</SelectItem>
                  <SelectItem value="current_quarter">Ce trimestre</SelectItem>
                  <SelectItem value="current_year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-8">Chargement des données...</div>
        ) : (
          <>
            {/* Period overview */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Résumé pour {getPeriodLabel()}</CardTitle>
                <CardDescription>
                  Vue d'ensemble des performances
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(salesData.total_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {salesData.total_sales} ventes • Panier: {formatCurrency(salesData.avg_order_value)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Production</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {productionData.total_produced.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {productionData.production_orders} ordres • Efficacité: {productionData.efficiency_rate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stock</CardTitle>
                  <Package className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stockData.total_value)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stockData.total_products} produits • {stockData.low_stock_items} en rupture
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bénéfice estimé</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(salesData.total_revenue * 0.3)} {/* Estimation à 30% de marge */}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimation basée sur 30% de marge
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly trends */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Évolution sur 6 mois</CardTitle>
                <CardDescription>
                  Tendances des ventes, production et dépenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((month, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded">
                      <div className="font-medium">{month.month}</div>
                      <div className="text-green-600">
                        Ventes: {formatCurrency(month.sales)}
                      </div>
                      <div className="text-blue-600">
                        Production: {month.production.toLocaleString()}
                      </div>
                      <div className="text-red-600">
                        Dépenses: {formatCurrency(month.expenses)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs de performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Taux de conversion stock → ventes</span>
                      <span className="font-medium">
                        {stockData.total_value > 0 
                          ? ((salesData.total_revenue / stockData.total_value) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Efficacité de production</span>
                      <span className="font-medium">{productionData.efficiency_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Articles en rupture de stock</span>
                      <span className={`font-medium ${stockData.low_stock_items > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stockData.low_stock_items}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Valeur moyenne par vente</span>
                      <span className="font-medium">{formatCurrency(salesData.avg_order_value)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommandations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stockData.low_stock_items > 0 && (
                      <div className="flex items-start space-x-2 p-3 bg-red-50 rounded">
                        <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Stock faible</p>
                          <p className="text-xs text-red-600">
                            {stockData.low_stock_items} produit(s) en rupture de stock
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {productionData.efficiency_rate < 80 && (
                      <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded">
                        <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Efficacité de production</p>
                          <p className="text-xs text-yellow-600">
                            Taux d'efficacité de {productionData.efficiency_rate.toFixed(1)}% - Optimisation recommandée
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {salesData.total_sales > 0 && (
                      <div className="flex items-start space-x-2 p-3 bg-green-50 rounded">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Performance des ventes</p>
                          <p className="text-xs text-green-600">
                            {salesData.total_sales} ventes réalisées - Bonne performance
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ReportsModule;