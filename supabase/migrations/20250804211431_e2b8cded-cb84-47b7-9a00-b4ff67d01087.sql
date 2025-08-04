-- Fix foreign key relationships and missing columns
-- Add foreign key constraint for production_orders to products
ALTER TABLE production_orders 
ADD CONSTRAINT fk_production_orders_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for sales to clients
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Add foreign key constraint for sales to products  
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for quotations to clients
ALTER TABLE quotations 
ADD CONSTRAINT fk_quotations_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Add foreign key constraint for quotations to products
ALTER TABLE quotations 
ADD CONSTRAINT fk_quotations_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for losses to products
ALTER TABLE losses 
ADD CONSTRAINT fk_losses_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for production to products
ALTER TABLE production 
ADD CONSTRAINT fk_production_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for stock to products
ALTER TABLE stock 
ADD CONSTRAINT fk_stock_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraint for invoices to sales
ALTER TABLE invoices 
ADD CONSTRAINT fk_invoices_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- Add foreign key constraint for deliveries to sales
ALTER TABLE deliveries 
ADD CONSTRAINT fk_deliveries_sale_id 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

-- Add foreign key constraint for overtime_hours to employees
ALTER TABLE overtime_hours 
ADD CONSTRAINT fk_overtime_hours_employee_id 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

-- Add payment_method column to sales table
ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'cash';

-- Add salary and contact info columns to employees if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary') THEN
        ALTER TABLE employees ADD COLUMN salary NUMERIC;
    END IF;
END $$;