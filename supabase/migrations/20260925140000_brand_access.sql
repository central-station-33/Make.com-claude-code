-- Brand-based access (RLS by brand).
-- Agents see and write only rows whose brand_id is a brand they are an
-- active member of (public.brand_members). Brokers see everything.
-- Added as RESTRICTIVE policies, so they narrow the existing
-- assignment-based and exclusive-isolation rules instead of replacing them.
-- Service-role callers (Edge Functions, Make) are unaffected.

CREATE OR REPLACE FUNCTION public.can_access_brand(p_brand uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $f$
  SELECT public.is_broker() OR EXISTS (
    SELECT 1
      FROM public.brand_members bm
      JOIN public.team_agents ta ON ta.id = bm.team_agent_id
     WHERE bm.brand_id = p_brand
       AND bm.status = 'active'
       AND ta.status = 'active'
       AND ta.auth_user_id = auth.uid()
  );
$f$;

REVOKE ALL ON FUNCTION public.can_access_brand(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_brand(uuid) TO authenticated;

DROP POLICY IF EXISTS "brand isolation" ON public.isa_leads;
CREATE POLICY "brand isolation" ON public.isa_leads AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_brand(brand_id)) WITH CHECK (public.can_access_brand(brand_id));

DROP POLICY IF EXISTS "brand isolation" ON public.properties;
CREATE POLICY "brand isolation" ON public.properties AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_brand(brand_id)) WITH CHECK (public.can_access_brand(brand_id));

DROP POLICY IF EXISTS "brand isolation" ON public.rental_units;
CREATE POLICY "brand isolation" ON public.rental_units AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_brand(brand_id)) WITH CHECK (public.can_access_brand(brand_id));

DROP POLICY IF EXISTS "brand isolation" ON public.exclusive_properties;
CREATE POLICY "brand isolation" ON public.exclusive_properties AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_brand(brand_id)) WITH CHECK (public.can_access_brand(brand_id));
