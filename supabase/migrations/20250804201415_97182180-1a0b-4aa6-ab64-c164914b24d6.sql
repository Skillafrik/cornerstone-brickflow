-- Create expenses table for accounting
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Expenses are viewable by everyone" 
ON public.expenses 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage expenses" 
ON public.expenses 
FOR ALL 
USING (true);

-- Create trigger for expenses timestamps
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position TEXT;

-- Create overtime_hours table for tracking employee overtime
CREATE TABLE public.overtime_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked NUMERIC(4,2) NOT NULL CHECK (hours_worked > 0),
  hourly_rate NUMERIC(8,2) NOT NULL CHECK (hourly_rate > 0),
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (hours_worked * hourly_rate) STORED,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on overtime_hours
ALTER TABLE public.overtime_hours ENABLE ROW LEVEL SECURITY;

-- Create policies for overtime_hours
CREATE POLICY "Overtime hours are viewable by everyone" 
ON public.overtime_hours 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage overtime hours" 
ON public.overtime_hours 
FOR ALL 
USING (true);

-- Create trigger for overtime_hours timestamps
CREATE TRIGGER update_overtime_hours_updated_at
  BEFORE UPDATE ON public.overtime_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update products table to ensure proper foreign key relationships work
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON public.stock(product_id);
CREATE INDEX IF NOT EXISTS idx_losses_product_id ON public.losses(product_id);
CREATE INDEX IF NOT EXISTS idx_production_product_id ON public.production(product_id);
CREATE INDEX IF NOT EXISTS idx_quotations_product_id ON public.quotations(product_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON public.invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_sale_id ON public.deliveries(sale_id);
CREATE INDEX IF NOT EXISTS idx_overtime_hours_employee_id ON public.overtime_hours(employee_id);