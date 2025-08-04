-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'production', 'vente', 'livraison', 'comptabilite', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Briques creux', 'Briques pleines', 'Hourdis')),
  dimensions TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pièce',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can manage products" ON public.products FOR ALL USING (true);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Clients are viewable by everyone" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Users can manage clients" ON public.clients FOR ALL USING (true);

-- Create stock table
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Create policies for stock
CREATE POLICY "Stock is viewable by everyone" ON public.stock FOR SELECT USING (true);
CREATE POLICY "Users can manage stock" ON public.stock FOR ALL USING (true);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sales
CREATE POLICY "Sales are viewable by everyone" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Users can manage sales" ON public.sales FOR ALL USING (true);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations
CREATE POLICY "Quotations are viewable by everyone" ON public.quotations FOR SELECT USING (true);
CREATE POLICY "Users can manage quotations" ON public.quotations FOR ALL USING (true);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Invoices are viewable by everyone" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Users can manage invoices" ON public.invoices FOR ALL USING (true);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'delivered', 'failed')),
  driver_name TEXT,
  vehicle_info TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for deliveries
CREATE POLICY "Deliveries are viewable by everyone" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Users can manage deliveries" ON public.deliveries FOR ALL USING (true);

-- Create production table
CREATE TABLE public.production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  planned_quantity INTEGER NOT NULL,
  produced_quantity INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production ENABLE ROW LEVEL SECURITY;

-- Create policies for production
CREATE POLICY "Production is viewable by everyone" ON public.production FOR SELECT USING (true);
CREATE POLICY "Users can manage production" ON public.production FOR ALL USING (true);

-- Create losses table
CREATE TABLE public.losses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  loss_type TEXT NOT NULL CHECK (loss_type IN ('damage', 'expiry', 'theft', 'other')),
  loss_date DATE NOT NULL,
  description TEXT,
  cost_impact DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.losses ENABLE ROW LEVEL SECURITY;

-- Create policies for losses
CREATE POLICY "Losses are viewable by everyone" ON public.losses FOR SELECT USING (true);
CREATE POLICY "Users can manage losses" ON public.losses FOR ALL USING (true);

-- Create objectives table
CREATE TABLE public.objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  category TEXT NOT NULL CHECK (category IN ('production', 'sales', 'quality', 'efficiency', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Create policies for objectives
CREATE POLICY "Objectives are viewable by everyone" ON public.objectives FOR SELECT USING (true);
CREATE POLICY "Users can manage objectives" ON public.objectives FOR ALL USING (true);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'production', 'vente', 'livraison', 'comptabilite', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hire_date DATE,
  salary DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees
CREATE POLICY "Employees are viewable by everyone" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Users can manage employees" ON public.employees FOR ALL USING (true);

-- Insert products data
INSERT INTO public.products (name, type, dimensions, unit, price) VALUES
-- Briques creux
('Brique 10 Creux', 'Briques creux', '40cm x 20cm x 10cm', 'pièce', 250),
('Brique 12 Creux', 'Briques creux', '40cm x 20cm x 12cm', 'pièce', 300),
('Brique 15 Creux', 'Briques creux', '40cm x 20cm x 15cm', 'pièce', 350),
('Brique 20 Creux', 'Briques creux', '40cm x 20cm x 20cm', 'pièce', 400),
-- Briques pleines
('Brique 10 Plein', 'Briques pleines', '40cm x 20cm x 10cm', 'pièce', 300),
('Brique 12 Plein', 'Briques pleines', '40cm x 20cm x 12cm', 'pièce', 360),
('Brique 15 Plein', 'Briques pleines', '40cm x 20cm x 15cm', 'pièce', 420),
('Brique 20 Plein', 'Briques pleines', '40cm x 20cm x 20cm', 'pièce', 480),
-- Hourdis
('Hourdis 12', 'Hourdis', '60cm x 20cm x 12cm', 'pièce', 800),
('Hourdis 15', 'Hourdis', '60cm x 20cm x 15cm', 'pièce', 950);

-- Insert initial stock for each product
INSERT INTO public.stock (product_id, quantity, minimum_stock, location)
SELECT id, 1000, 100, 'Entrepôt principal' FROM public.products;

-- Insert some sample clients
INSERT INTO public.clients (name, email, phone, address, company) VALUES
('Moussa Diallo', 'moussa.diallo@email.com', '+221 77 123 4567', 'Dakar, Sénégal', 'Construction Diallo'),
('Fatou Ba', 'fatou.ba@email.com', '+221 70 987 6543', 'Thiès, Sénégal', 'BTP Ba & Associés'),
('Amadou Ndiaye', 'amadou.ndiaye@email.com', '+221 76 555 8888', 'Saint-Louis, Sénégal', 'Ndiaye Construction'),
('Aissatou Fall', 'aissatou.fall@email.com', '+221 78 444 7777', 'Kaolack, Sénégal', 'Entreprise Fall'),
('Ibrahima Sarr', 'ibrahima.sarr@email.com', '+221 77 333 6666', 'Ziguinchor, Sénégal', 'Sarr BTP');

-- Insert some sample sales
INSERT INTO public.sales (client_id, product_id, quantity, unit_price, total_amount, sale_date, status)
SELECT 
  c.id,
  p.id,
  CASE 
    WHEN RANDOM() < 0.3 THEN 100
    WHEN RANDOM() < 0.6 THEN 200
    ELSE 500
  END as quantity,
  p.price,
  (CASE 
    WHEN RANDOM() < 0.3 THEN 100
    WHEN RANDOM() < 0.6 THEN 200
    ELSE 500
  END) * p.price as total_amount,
  now() - (RANDOM() * INTERVAL '30 days'),
  CASE 
    WHEN RANDOM() < 0.7 THEN 'completed'
    WHEN RANDOM() < 0.9 THEN 'pending'
    ELSE 'cancelled'
  END
FROM public.clients c
CROSS JOIN public.products p
WHERE RANDOM() < 0.4
LIMIT 25;

-- Insert some sample production records
INSERT INTO public.production (product_id, planned_quantity, produced_quantity, start_date, end_date, status)
SELECT 
  id,
  2000 + (RANDOM() * 3000)::INTEGER,
  1800 + (RANDOM() * 2000)::INTEGER,
  CURRENT_DATE - (RANDOM() * 60)::INTEGER,
  CURRENT_DATE + (RANDOM() * 30)::INTEGER,
  CASE 
    WHEN RANDOM() < 0.5 THEN 'completed'
    WHEN RANDOM() < 0.8 THEN 'in_progress'
    ELSE 'planned'
  END
FROM public.products
WHERE RANDOM() < 0.8;

-- Insert some sample objectives
INSERT INTO public.objectives (title, description, target_value, current_value, unit, start_date, end_date, status, category) VALUES
('Production mensuelle briques', 'Atteindre 50000 briques produites ce mois', 50000, 35000, 'pièces', CURRENT_DATE - 15, CURRENT_DATE + 15, 'active', 'production'),
('Ventes trimestrielles', 'Objectif de ventes pour ce trimestre', 25000000, 18500000, 'FCFA', CURRENT_DATE - 45, CURRENT_DATE + 45, 'active', 'sales'),
('Qualité production', 'Réduire les défauts à moins de 2%', 2, 3.2, '%', CURRENT_DATE - 30, CURRENT_DATE + 60, 'active', 'quality'),
('Efficacité livraisons', 'Livraisons à temps à 95%', 95, 88, '%', CURRENT_DATE - 20, CURRENT_DATE + 40, 'active', 'efficiency');

-- Insert some sample employees
INSERT INTO public.employees (first_name, last_name, email, phone, role, hire_date, salary) VALUES
('Seydou', 'GSM', 'seydou.gsm@email.com', '+221 77 203 3210', 'admin', '2020-01-15', 750000),
('Aminata', 'Diop', 'aminata.diop@email.com', '+221 76 111 2222', 'production', '2021-03-10', 450000),
('Omar', 'Seck', 'omar.seck@email.com', '+221 77 333 4444', 'vente', '2021-06-20', 500000),
('Mariam', 'Thiam', 'mariam.thiam@email.com', '+221 78 555 6666', 'comptabilite', '2022-01-05', 550000),
('Cheikh', 'Diouf', 'cheikh.diouf@email.com', '+221 70 777 8888', 'livraison', '2022-08-15', 400000);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON public.stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_production_updated_at BEFORE UPDATE ON public.production FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_losses_updated_at BEFORE UPDATE ON public.losses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();