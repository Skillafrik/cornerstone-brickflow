-- Création du schéma complet pour Cornerstone Gesco

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'production', 'vente', 'livraison', 'comptabilite', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des catégories de produits
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des produits (briques)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  dimensions TEXT NOT NULL, -- ex: "40 x 20 x 10"
  unit_price DECIMAL(10,2) DEFAULT 0,
  production_cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de gestion du stock
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER DEFAULT 100,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(user_id)
);

-- Table des clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des devis
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des éléments de devis
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des ventes
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  quotation_id UUID REFERENCES public.quotations(id),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  payment_method TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des éléments de vente
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des factures
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  sale_id UUID REFERENCES public.sales(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  type TEXT DEFAULT 'definitive' CHECK (type IN ('proforma', 'definitive')),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des ordres de production
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_requested INTEGER NOT NULL,
  quantity_produced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  approved_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des livraisons
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_number TEXT NOT NULL UNIQUE,
  sale_id UUID NOT NULL REFERENCES public.sales(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  delivery_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'delivered', 'cancelled')),
  scheduled_date DATE,
  delivered_date DATE,
  driver_name TEXT,
  vehicle_info TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  delivered_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des éléments de livraison
CREATE TABLE public.delivery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_expected INTEGER NOT NULL,
  quantity_delivered INTEGER DEFAULT 0,
  quantity_broken INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des pertes
CREATE TABLE public.losses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('production', 'stock', 'delivery', 'other')),
  cause TEXT,
  description TEXT,
  cost_impact DECIMAL(10,2) DEFAULT 0,
  delivery_id UUID REFERENCES public.deliveries(id),
  production_order_id UUID REFERENCES public.production_orders(id),
  reported_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des dépenses comptables
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('materials', 'salary', 'maintenance', 'utilities', 'transport', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des objectifs mensuels
CREATE TABLE public.monthly_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  target_quantity INTEGER NOT NULL,
  target_revenue DECIMAL(12,2),
  loss_reduction_target DECIMAL(5,2) DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year, product_id)
);

-- Table des paramètres système
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  updated_by UUID REFERENCES public.profiles(user_id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table FAQ
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activation de RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les profils
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Politiques générales pour les autres tables (lecture pour utilisateurs connectés)
CREATE POLICY "Authenticated users can read product_categories" ON public.product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read stock" ON public.stock
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read clients" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read quotations" ON public.quotations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sales" ON public.sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read invoices" ON public.invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read production_orders" ON public.production_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read deliveries" ON public.deliveries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read losses" ON public.losses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read objectives" ON public.monthly_objectives
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read faq" ON public.faq
  FOR SELECT TO authenticated USING (true);

-- Politiques d'insertion/modification (pour les admins principalement)
CREATE POLICY "Admins can insert/update all data" ON public.product_categories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON public.production_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON public.faq
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insertion des données de base

-- Catégories de produits
INSERT INTO public.product_categories (name, description) VALUES
('Briques creux', 'Briques avec cavités pour isolation'),
('Briques pleines', 'Briques pleines pour structure'),
('Hourdis', 'Éléments de plancher');

-- Produits (briques) avec les dimensions spécifiées
INSERT INTO public.products (category_id, name, dimensions, unit_price, production_cost) 
SELECT 
  pc.id,
  p.name,
  p.dimensions,
  p.unit_price,
  p.production_cost
FROM public.product_categories pc
CROSS JOIN (
  SELECT '10 Creux' as name, '40 x 20 x 10' as dimensions, 150.00 as unit_price, 100.00 as production_cost, 'Briques creux' as category
  UNION ALL SELECT '12 Creux', '40 x 20 x 12', 180.00, 120.00, 'Briques creux'
  UNION ALL SELECT '15 Creux', '40 x 20 x 15', 200.00, 140.00, 'Briques creux'
  UNION ALL SELECT '20 Creux', '40 x 20 x 20', 250.00, 180.00, 'Briques creux'
  UNION ALL SELECT '10 Plein', '40 x 20 x 10', 170.00, 110.00, 'Briques pleines'
  UNION ALL SELECT '12 Plein', '40 x 20 x 12', 200.00, 130.00, 'Briques pleines'
  UNION ALL SELECT '15 Plein', '40 x 20 x 15', 220.00, 150.00, 'Briques pleines'
  UNION ALL SELECT '20 Plein', '40 x 20 x 20', 270.00, 190.00, 'Briques pleines'
  UNION ALL SELECT 'Hourdis 12', '60 x 20 x 12', 300.00, 200.00, 'Hourdis'
  UNION ALL SELECT 'Hourdis 15', '60 x 20 x 15', 350.00, 240.00, 'Hourdis'
) p
WHERE pc.name = p.category;

-- Initialisation du stock pour tous les produits
INSERT INTO public.stock (product_id, quantity, min_threshold)
SELECT id, 0, 100 FROM public.products;

-- Paramètres système par défaut
INSERT INTO public.system_settings (key, value, description, type) VALUES
('company_name', 'Cornerstone Briques', 'Nom de l''entreprise', 'string'),
('company_address', 'Lomé, Togo', 'Adresse de l''entreprise', 'string'),
('company_phone', '+228 XX XX XX XX', 'Téléphone de l''entreprise', 'string'),
('company_email', 'contact@cornerstone-briques.tg', 'Email de l''entreprise', 'string'),
('default_tax_rate', '18.00', 'Taux de TVA par défaut (%)', 'number'),
('currency', 'FCFA', 'Devise utilisée', 'string'),
('low_stock_threshold', '50', 'Seuil de stock faible', 'number');

-- FAQ de base
INSERT INTO public.faq (question, answer, category, order_index) VALUES
('Comment créer une nouvelle vente ?', 'Allez dans le module Ventes, cliquez sur "Nouvelle vente", sélectionnez le client et les produits.', 'Ventes', 1),
('Comment gérer le stock ?', 'Le stock se met à jour automatiquement lors des ventes et productions. Vous pouvez aussi faire des ajustements manuels.', 'Stock', 1),
('Comment créer un devis ?', 'Dans le module Devis, sélectionnez le client, ajoutez les produits souhaités et générez le document.', 'Devis', 1),
('Qui peut accéder aux rapports ?', 'Les administrateurs et les managers ont accès aux rapports complets. Les autres rôles ont des accès limités.', 'Général', 1);