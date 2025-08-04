import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  FileText, 
  Receipt, 
  Truck, 
  Factory, 
  TrendingDown, 
  Calculator, 
  Users, 
  Target, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  UserCheck,
  LogOut,
  Home
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (module: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {

  const modules = [
    {
      id: 'stock',
      title: 'Stock',
      description: 'Gestion des stocks de briques',
      icon: Package,
      color: 'bg-blue-500',
      roles: ['admin', 'production', 'vente']
    },
    {
      id: 'sales',
      title: 'Ventes',
      description: 'Enregistrement des ventes',
      icon: ShoppingCart,
      color: 'bg-green-500',
      roles: ['admin', 'vente']
    },
    {
      id: 'quotations',
      title: 'Devis',
      description: 'Création et gestion des devis',
      icon: FileText,
      color: 'bg-orange-500',
      roles: ['admin', 'vente']
    },
    {
      id: 'invoices',
      title: 'Factures',
      description: 'Facturation et suivi',
      icon: Receipt,
      color: 'bg-purple-500',
      roles: ['admin', 'vente', 'comptabilite']
    },
    {
      id: 'deliveries',
      title: 'Livraisons',
      description: 'Gestion des livraisons',
      icon: Truck,
      color: 'bg-cyan-500',
      roles: ['admin', 'livraison', 'vente']
    },
    {
      id: 'production',
      title: 'Production',
      description: 'Ordres de production',
      icon: Factory,
      color: 'bg-red-500',
      roles: ['admin', 'production']
    },
    {
      id: 'losses',
      title: 'Pertes',
      description: 'Suivi des pertes et casses',
      icon: TrendingDown,
      color: 'bg-yellow-500',
      roles: ['admin', 'production', 'livraison']
    },
    {
      id: 'accounting',
      title: 'Comptabilité',
      description: 'Gestion comptable',
      icon: Calculator,
      color: 'bg-indigo-500',
      roles: ['admin', 'comptabilite']
    },
    {
      id: 'employees',
      title: 'Employés',
      description: 'Gestion du personnel',
      icon: Users,
      color: 'bg-pink-500',
      roles: ['admin']
    },
    {
      id: 'objectives',
      title: 'Objectifs',
      description: 'Objectifs et suivi',
      icon: Target,
      color: 'bg-emerald-500',
      roles: ['admin', 'production']
    },
    {
      id: 'reports',
      title: 'Rapports',
      description: 'Analyses et statistiques',
      icon: BarChart3,
      color: 'bg-slate-500',
      roles: ['admin', 'comptabilite']
    },
    {
      id: 'clients',
      title: 'Clients',
      description: 'Base clients',
      icon: UserCheck,
      color: 'bg-teal-500',
      roles: ['admin', 'vente']
    },
    {
      id: 'settings',
      title: 'Paramètres',
      description: 'Configuration système',
      icon: Settings,
      color: 'bg-gray-500',
      roles: ['admin']
    },
    {
      id: 'faq',
      title: 'FAQ & Aide',
      description: 'Documentation et aide',
      icon: HelpCircle,
      color: 'bg-violet-500',
      roles: ['admin', 'production', 'vente', 'livraison', 'comptabilite', 'user']
    }
  ];

  // Show all modules since we removed authentication
  const userModules = modules;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Cornerstone GESCO</h1>
                <p className="text-sm text-muted-foreground">Système de gestion - Briqueterie</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Utilisateur</p>
              <p className="text-xs text-muted-foreground">Mode démo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bienvenue dans Cornerstone GESCO !
          </h2>
          <p className="text-muted-foreground">
            Système de gestion complet pour briqueterie - Mode démo
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345</div>
              <p className="text-xs text-muted-foreground">briques en stock</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes du mois</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,456,000</div>
              <p className="text-xs text-muted-foreground">FCFA ce mois</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livraisons</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">en cours</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">objectif atteint</p>
            </CardContent>
          </Card>
        </div>

        {/* Modules grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Modules disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="cursor-pointer hover:shadow-brick transition-all duration-200 hover:scale-105 group"
                  onClick={() => onNavigate(module.id)}
                >
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Actions rapides</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="justify-start gradient-brick"
                onClick={() => onNavigate('sales')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nouvelle vente
              </Button>
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => onNavigate('stock')}
              >
                <Package className="h-4 w-4 mr-2" />
                Vérifier stock
              </Button>
              <Button 
                variant="outline"
                className="justify-start"
                onClick={() => onNavigate('production')}
              >
                <Factory className="h-4 w-4 mr-2" />
                Ordre production
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;