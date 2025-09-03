-- Create day_status view for streak calculations
-- A day is considered "complete" if at least 1 prompt is completed (not all 5)
CREATE OR REPLACE VIEW public.day_status AS
SELECT 
  c.device_id,
  c.for_date,
  COUNT(DISTINCT c.prompt_id) as completed_count,
  -- A day is complete if at least 1 prompt is completed
  CASE WHEN COUNT(DISTINCT c.prompt_id) >= 1 THEN true ELSE false END as is_complete
FROM public.completions c
GROUP BY c.device_id, c.for_date;

-- Enable RLS on the view
ALTER VIEW public.day_status SET (security_invoker = true);
