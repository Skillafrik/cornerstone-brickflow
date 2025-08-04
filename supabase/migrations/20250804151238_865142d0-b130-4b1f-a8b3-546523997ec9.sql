-- Correction de l'erreur : Suppression des données FAQ et ajout de politiques manquantes

-- Supprimer les données FAQ problématiques
DELETE FROM public.faq;

-- Ajouter les politiques manquantes pour toutes les tables
CREATE POLICY "Authenticated users can create products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create stock" ON public.stock
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock" ON public.stock
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create quotations" ON public.quotations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotations" ON public.quotations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create quotation_items" ON public.quotation_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can create sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales" ON public.sales
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create sale_items" ON public.sale_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can create invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create production_orders" ON public.production_orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update production_orders" ON public.production_orders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create deliveries" ON public.deliveries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update deliveries" ON public.deliveries
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can create delivery_items" ON public.delivery_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can create losses" ON public.losses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can create expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can create objectives" ON public.monthly_objectives
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update objectives" ON public.monthly_objectives
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create faq" ON public.faq
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update faq" ON public.faq
  FOR UPDATE TO authenticated USING (true);