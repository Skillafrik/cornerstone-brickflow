import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleNavigate = (module: string) => {
    setCurrentModule(module);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement de Cornerstone Gesco...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-4">Cornerstone GESCO</h1>
          <p className="text-muted-foreground mb-6">Système de gestion pour briqueterie</p>
          <Button onClick={() => navigate('/auth')} className="gradient-brick">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
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
