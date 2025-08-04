import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, HelpCircle, Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FaqModuleProps {
  onBack: () => void;
}

const FaqModule = ({ onBack }: FaqModuleProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      id: '1',
      question: 'Comment créer une nouvelle vente ?',
      answer: 'Allez dans le module Ventes, cliquez sur "Nouvelle vente", sélectionnez le client et le produit, puis saisissez la quantité.'
    },
    {
      id: '2',
      question: 'Comment gérer les stocks ?',
      answer: 'Le module Stock permet de voir les niveaux actuels, définir des seuils min/max et suivre les mouvements.'
    },
    {
      id: '3',
      question: 'Comment programmer une livraison ?',
      answer: 'Dans le module Livraisons, sélectionnez une vente terminée et programmez la date de livraison.'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <HelpCircle className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">FAQ & Aide</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Questions fréquemment posées</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FaqModule;