-- Supprimer les contraintes de clés étrangères en double qui causent les conflits
-- Nous gardons seulement les contraintes nommées explicitement

-- Supprimer les anciennes contraintes auto-générées pour éviter les conflits
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_product_id_fkey;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_client_id_fkey;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_product_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_sale_id_fkey;
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_sale_id_fkey;
ALTER TABLE production_orders DROP CONSTRAINT IF EXISTS production_orders_product_id_fkey;
ALTER TABLE production DROP CONSTRAINT IF EXISTS production_product_id_fkey;
ALTER TABLE losses DROP CONSTRAINT IF EXISTS losses_product_id_fkey;
ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_product_id_fkey;
ALTER TABLE overtime_hours DROP CONSTRAINT IF EXISTS overtime_hours_employee_id_fkey;

-- Recréer les contraintes avec des noms explicites pour éviter les doublons
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE sales 
ADD CONSTRAINT fk_sales_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE quotations 
ADD CONSTRAINT fk_quotations_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE quotations 
ADD CONSTRAINT fk_quotations_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE deliveries 
ADD CONSTRAINT fk_deliveries_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE production_orders 
ADD CONSTRAINT fk_production_orders_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE production 
ADD CONSTRAINT fk_production_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE losses 
ADD CONSTRAINT fk_losses_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE stock 
ADD CONSTRAINT fk_stock_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE overtime_hours 
ADD CONSTRAINT fk_overtime_hours_employee_id 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;