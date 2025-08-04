-- Fix invoices table - add missing columns
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS issue_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update existing records to have issue_date same as created_at
UPDATE public.invoices 
SET issue_date = created_at::date 
WHERE issue_date IS NULL;