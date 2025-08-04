import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';

// Import all modules  
import StockModule from '@/components/modules/StockModule';
import SalesModule from '@/components/modules/SalesModule';
import QuotationsModule from '@/components/modules/QuotationsModule';
import InvoicesModule from '@/components/modules/InvoicesModule';
import DeliveriesModule from '@/components/modules/DeliveriesModule';
import ProductionModule from '@/components/modules/ProductionModule';
import LossesModule from '@/components/modules/LossesModule';
import AccountingModule from '@/components/modules/AccountingModule';
import EmployeesModule from '@/components/modules/EmployeesModule';
import ObjectivesModule from '@/components/modules/ObjectivesModule';
import ReportsModule from '@/components/modules/ReportsModule';
import ClientsModule from '@/components/modules/ClientsModule';
import SettingsModule from '@/components/modules/SettingsModule';
import FaqModule from '@/components/modules/FaqModule';

const Index = () => {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'stock':
        return <StockModule onBack={() => setCurrentModule('dashboard')} />;
      case 'sales':
        return <SalesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'quotations':
        return <QuotationsModule onBack={() => setCurrentModule('dashboard')} />;
      case 'invoices':
        return <InvoicesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'deliveries':
        return <DeliveriesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'production':
        return <ProductionModule onBack={() => setCurrentModule('dashboard')} />;
      case 'losses':
        return <LossesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'accounting':
        return <AccountingModule onBack={() => setCurrentModule('dashboard')} />;
      case 'employees':
        return <EmployeesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'objectives':
        return <ObjectivesModule onBack={() => setCurrentModule('dashboard')} />;
      case 'reports':
        return <ReportsModule onBack={() => setCurrentModule('dashboard')} />;
      case 'clients':
        return <ClientsModule onBack={() => setCurrentModule('dashboard')} />;
      case 'settings':
        return <SettingsModule onBack={() => setCurrentModule('dashboard')} />;
      case 'faq':
        return <FaqModule onBack={() => setCurrentModule('dashboard')} />;
      default:
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Module: {currentModule}</h1>
              <p className="text-muted-foreground mb-6">Ce module sera bientôt disponible.</p>
              <Button onClick={() => setCurrentModule('dashboard')} variant="outline">
                Retour au dashboard
              </Button>
            </div>
          </div>
        );
    }
  };

  return renderModule();
};

export default Index;
