import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SettingsModuleProps {
  onBack: () => void;
}

const SettingsModule = ({ onBack }: SettingsModuleProps) => {
  const [settings, setSettings] = useState({
    company_name: 'Cornerstone GESCO',
    address: '',
    phone: '',
    email: '',
    tax_rate: '18'
  });
  const { toast } = useToast();

  const handleSave = async () => {
    toast({
      title: "Succès",
      description: "Paramètres sauvegardés",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="tax_rate">Taux de TVA (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={settings.tax_rate}
                onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
              />
            </div>
            <Button onClick={handleSave} className="gradient-brick">
              Sauvegarder
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SettingsModule;