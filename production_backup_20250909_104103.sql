

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."admin_update_user_role"("target_user_id" "uuid", "new_role" "text", "reason" "text" DEFAULT ''::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_role TEXT;
  old_role TEXT;
  result JSON;
BEGIN
  -- Verify current user is Super Admin
  SELECT get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'Super Admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only Super Admins can change user roles'
    );
  END IF;
  
  -- Get current role for audit
  SELECT role INTO old_role FROM users WHERE id = target_user_id;
  
  IF old_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('Super Admin', 'Partner Admin', 'Vendor') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role specified'
    );
  END IF;
  
  -- Update the role
  UPDATE users 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the security event
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    target_user_id,
    old_value,
    new_value,
    performed_by,
    ip_address
  ) VALUES (
    'role_change',
    auth.uid(),
    target_user_id,
    old_role,
    new_role,
    auth.uid(),
    inet_client_addr()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'old_role', old_role,
    'new_role', new_role
  );
END;
$$;


ALTER FUNCTION "public"."admin_update_user_role"("target_user_id" "uuid", "new_role" "text", "reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_hybrid_storage_limit"("vendor_id" "uuid", "file_size" bigint) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  vendor_used BIGINT;
  vendor_limit BIGINT;
  broker_used BIGINT;
  broker_limit BIGINT;
  result JSON;
BEGIN
  -- Get vendor storage info
  SELECT storage_used, storage_limit INTO vendor_used, vendor_limit
  FROM vendors WHERE id = vendor_id;
  
  -- Get broker storage info
  SELECT p.storage_used, p.storage_limit INTO broker_used, broker_limit
  FROM partners p
  JOIN vendors v ON v.partner_admin_id = p.id
  WHERE v.id = vendor_id;
  
  -- Check vendor individual limit first
  IF (vendor_used + file_size) > vendor_limit THEN
    result := json_build_object(
      'allowed', false,
      'reason', 'vendor_limit',
      'message', 'You have exceeded your individual storage limit. Please delete some files or ask your broker to upgrade.'
    );
    RETURN result;
  END IF;
  
  -- Check broker total limit
  IF (broker_used + file_size) > broker_limit THEN
    result := json_build_object(
      'allowed', false, 
      'reason', 'broker_limit',
      'message', 'Your broker has exceeded their total storage limit. Please contact your broker to upgrade their plan.'
    );
    RETURN result;
  END IF;
  
  -- All checks passed
  result := json_build_object(
    'allowed', true,
    'vendor_remaining', vendor_limit - vendor_used - file_size,
    'broker_remaining', broker_limit - broker_used - file_size
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_hybrid_storage_limit"("vendor_id" "uuid", "file_size" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_file_path"("broker_id" "uuid", "vendor_id" "uuid", "filename" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Generate path: broker-id/vendor-vendor-id/secure-filename
  RETURN broker_id::text || '/vendor-' || vendor_id::text || '/' || filename;
END;
$$;


ALTER FUNCTION "public"."generate_file_path"("broker_id" "uuid", "vendor_id" "uuid", "filename" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_partner_id"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    p_id uuid;
BEGIN
    -- Select the partner_id from the public.users table for the given user_id
    -- This read will bypass RLS because the function is SECURITY DEFINER
    SELECT partner_id INTO p_id FROM public.users WHERE id = user_id;
    RETURN p_id;
END;
$$;


ALTER FUNCTION "public"."get_user_partner_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role text;
BEGIN
    -- Select the role from the public.users table for the given user_id
    -- This read will bypass RLS because the function is SECURITY DEFINER
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vendor_partner_admin_id"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get the partner_id for the vendor associated with the given user_id
    -- This bypasses RLS because the function is SECURITY DEFINER
    SELECT partner_id INTO admin_id 
    FROM public.vendors 
    WHERE user_id = user_id;
    
    RETURN admin_id;
END;
$$;


ALTER FUNCTION "public"."get_vendor_partner_admin_id"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_minimal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Skip demo users
  IF NEW.email LIKE '%demo-%' OR NEW.email LIKE '%@vendorhub.com' THEN
    RETURN NEW;
  END IF;

  -- Only insert into users table, let Stripe webhook handle subscription data
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Partner Admin'),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_minimal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_vendor_for_submission"("submission_vendor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if the current user is the vendor for the given submission
    -- This bypasses RLS because the function is SECURITY DEFINER
    RETURN EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE id = submission_vendor_id 
        AND user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."is_current_user_vendor_for_submission"("submission_vendor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "details" "text" DEFAULT ''::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    old_value,
    performed_by,
    ip_address
  ) VALUES (
    event_type,
    auth.uid(),
    details,
    auth.uid(),
    inet_client_addr()
  );
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "details" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_storage_limits_by_plan"("partner_id" "uuid", "plan_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  broker_limit BIGINT;
  vendor_limit BIGINT;
BEGIN
  -- Set limits based on plan
  CASE plan_name
    WHEN 'starter' THEN
      broker_limit := 5368709120;  -- 5GB
      vendor_limit := 2147483648;  -- 2GB per vendor
    WHEN 'professional' THEN
      broker_limit := 26843545600; -- 25GB  
      vendor_limit := 5368709120;  -- 5GB per vendor
    WHEN 'enterprise' THEN
      broker_limit := 107374182400; -- 100GB
      vendor_limit := 10737418240;  -- 10GB per vendor
    ELSE
      RAISE EXCEPTION 'Invalid plan name: %', plan_name;
  END CASE;
  
  -- Update partner limit
  UPDATE partners 
  SET storage_limit = broker_limit
  WHERE id = partner_id;
  
  -- Update all vendor limits for this partner
  UPDATE vendors 
  SET storage_limit = vendor_limit
  WHERE partner_admin_id = partner_id;
END;
$$;


ALTER FUNCTION "public"."set_storage_limits_by_plan"("partner_id" "uuid", "plan_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_hybrid_storage_usage"("vendor_id" "uuid", "file_size" bigint, "is_delete" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  size_change BIGINT;
BEGIN
  size_change := CASE WHEN is_delete THEN -file_size ELSE file_size END;
  
  -- Update vendor storage
  UPDATE vendors 
  SET storage_used = storage_used + size_change
  WHERE id = vendor_id;
  
  -- Update broker storage
  UPDATE partners 
  SET storage_used = storage_used + size_change
  WHERE id = (SELECT partner_admin_id FROM vendors WHERE id = vendor_id);
END;
$$;


ALTER FUNCTION "public"."update_hybrid_storage_usage"("vendor_id" "uuid", "file_size" bigint, "is_delete" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_partner_storage"("partner_id" "uuid", "size_change" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE partners 
  SET storage_used = GREATEST(0, storage_used + size_change)
  WHERE id = partner_id;
END;
$$;


ALTER FUNCTION "public"."update_partner_storage"("partner_id" "uuid", "size_change" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_plan_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Set storage and vendor limits based on plan
  CASE NEW.plan_type
    WHEN 'basic' THEN
      NEW.storage_limit := 5368709120;  -- 5GB
      NEW.vendor_limit := 3;
    WHEN 'pro' THEN  
      NEW.storage_limit := 26843545600; -- 25GB
      NEW.vendor_limit := 7;
    WHEN 'premium' THEN
      NEW.storage_limit := 107374182400; -- 100GB
      NEW.vendor_limit := 999999; -- unlimited
    ELSE
      NEW.storage_limit := 5368709120;  -- Default to basic
      NEW.vendor_limit := 3;
  END CASE;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_plan_limits"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" character varying(255) NOT NULL,
    "email" character varying(255),
    "phone" character varying(50),
    "address" "text",
    "biz_name" character varying(255),
    "biz_phone" character varying(50),
    "biz_address" "text",
    "biz_start_date" "date",
    "ein" character varying(50),
    "ssn" character varying(11),
    "dob" "date",
    "credit_permission" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."customers"."biz_phone" IS 'Business phone number, separate from personal phone';



CREATE TABLE IF NOT EXISTS "public"."demo_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "company" character varying(255) NOT NULL,
    "role" character varying(100) NOT NULL,
    "phone" character varying(50),
    "employees" character varying(50),
    "use_case" "text",
    "session_id" character varying(255),
    "demo_started_at" timestamp with time zone,
    "demo_completed_at" timestamp with time zone,
    "demo_credentials" "jsonb",
    "engagement_score" integer,
    "follow_up_status" character varying(50),
    "notes" "text",
    "last_activity_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."demo_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "contact_email" character varying(255) NOT NULL,
    "contact_phone" character varying(50),
    "plan_type" character varying(50) DEFAULT 'basic'::character varying NOT NULL,
    "billing_status" character varying(50) DEFAULT 'trialing'::character varying NOT NULL,
    "trial_end" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "vendor_limit" integer DEFAULT 1 NOT NULL,
    "storage_limit" bigint DEFAULT '5368709120'::bigint NOT NULL,
    "storage_used" bigint DEFAULT 0 NOT NULL,
    "stripe_customer_id" character varying(255),
    "stripe_subscription_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "file_url" "text",
    "file_type" character varying(100),
    "file_size" bigint,
    "resource_type" character varying(50) DEFAULT 'document'::character varying,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "mime_type" "text",
    "category" "text" DEFAULT 'general'::"text"
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(255) NOT NULL,
    "resource_type" character varying(100),
    "resource_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."setup_fee_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "customer_email" "text" NOT NULL,
    "plan_type" "text" NOT NULL,
    "is_annual" boolean NOT NULL,
    "amount_paid" integer NOT NULL,
    "payment_status" "text" DEFAULT 'paid'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."setup_fee_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "action" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" bigint,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."storage_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "customer_id" "uuid",
    "status" character varying(50) DEFAULT 'submitted'::character varying,
    "submission_date" timestamp with time zone DEFAULT "now"(),
    "approval_terms" "text",
    "equipment_type" character varying(100),
    "equipment_description" "text",
    "equipment_cost" numeric(12,2),
    "financing_amount" numeric(12,2),
    "down_payment" numeric(12,2),
    "credit_score" integer,
    "time_in_business" integer,
    "annual_revenue" numeric(12,2),
    "sales_invoice_url" "text",
    "drivers_license_url" "text",
    "misc_documents_url" "text"[],
    "prequalification_result" character varying(10),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscribed" boolean DEFAULT false NOT NULL,
    "subscription_tier" "text",
    "subscription_end" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "trial_active" boolean DEFAULT false,
    "status" character varying(50) DEFAULT 'inactive'::character varying,
    "price_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscribers_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['Basic'::"text", 'Pro'::"text", 'Premium'::"text", 'Enterprise'::"text"])))
);


ALTER TABLE "public"."subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255),
    "role" character varying(50) DEFAULT 'Partner Admin'::character varying NOT NULL,
    "partner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "vendor_name" character varying(255) NOT NULL,
    "contact_email" character varying(255) NOT NULL,
    "contact_phone" character varying(50),
    "contact_address" "text",
    "business_type" character varying(100),
    "tax_id" character varying(50),
    "website_url" character varying(255),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "invitation_status" character varying(50) DEFAULT 'pending'::character varying,
    "invitation_token" character varying(255),
    "invited_by" "uuid",
    "invitation_sent_at" timestamp with time zone DEFAULT "now"(),
    "invitation_accepted_at" timestamp with time zone,
    "prequalification_enabled" boolean DEFAULT true,
    "max_deal_amount" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "storage_used" bigint DEFAULT 0,
    "storage_limit" bigint DEFAULT '2147483648'::bigint
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_leads"
    ADD CONSTRAINT "demo_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_contact_email_key" UNIQUE ("contact_email");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setup_fee_payments"
    ADD CONSTRAINT "setup_fee_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."setup_fee_payments"
    ADD CONSTRAINT "setup_fee_payments_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."storage_audit_log"
    ADD CONSTRAINT "storage_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_demo_leads_email" ON "public"."demo_leads" USING "btree" ("email");



CREATE INDEX "idx_partners_contact_email" ON "public"."partners" USING "btree" ("contact_email");



CREATE INDEX "idx_resources_partner_id" ON "public"."resources" USING "btree" ("partner_id");



CREATE INDEX "idx_security_audit_log_user_id" ON "public"."security_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_submissions_customer_id" ON "public"."submissions" USING "btree" ("customer_id");



CREATE INDEX "idx_submissions_partner_id" ON "public"."submissions" USING "btree" ("partner_id");



CREATE INDEX "idx_submissions_vendor_id" ON "public"."submissions" USING "btree" ("vendor_id");



CREATE INDEX "idx_subscribers_email" ON "public"."subscribers" USING "btree" ("email");



CREATE INDEX "idx_subscribers_user_id" ON "public"."subscribers" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_partner_id" ON "public"."users" USING "btree" ("partner_id");



CREATE INDEX "idx_vendors_contact_email" ON "public"."vendors" USING "btree" ("contact_email");



CREATE INDEX "idx_vendors_partner_id" ON "public"."vendors" USING "btree" ("partner_id");



CREATE INDEX "idx_vendors_user_id" ON "public"."vendors" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_partner_plan_limits" BEFORE INSERT OR UPDATE OF "plan_type" ON "public"."partners" FOR EACH ROW EXECUTE FUNCTION "public"."update_plan_limits"();



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_partner_id" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."storage_audit_log"
    ADD CONSTRAINT "storage_audit_log_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscribers"
    ADD CONSTRAINT "subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Enable select for users based on user_id" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable update for users based on user_id" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Partner Admins can manage their resources" ON "public"."resources" USING ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"))) WITH CHECK ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text")));



CREATE POLICY "Partner Admins can manage their vendors" ON "public"."vendors" USING ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"))) WITH CHECK ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text")));



CREATE POLICY "Partner Admins can update their partner" ON "public"."partners" FOR UPDATE USING ((("public"."get_user_role"("auth"."uid"()) = 'Partner Admin'::"text") AND ("public"."get_user_partner_id"("auth"."uid"()) = "id"))) WITH CHECK ((("public"."get_user_role"("auth"."uid"()) = 'Partner Admin'::"text") AND ("public"."get_user_partner_id"("auth"."uid"()) = "id")));



CREATE POLICY "Partner Admins can update their submissions" ON "public"."submissions" FOR UPDATE USING ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"))) WITH CHECK ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text")));



CREATE POLICY "Partner Admins can view their partner" ON "public"."partners" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'Partner Admin'::"text") AND ("public"."get_user_partner_id"("auth"."uid"()) = "id")));



CREATE POLICY "Partners can manage their resources" ON "public"."resources" USING (("partner_id" = ( SELECT "users"."partner_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Super Admins can manage all partners" ON "public"."partners" USING (("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"));



CREATE POLICY "Super Admins can manage setup fee payments" ON "public"."setup_fee_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super Admins can update demo leads" ON "public"."demo_leads" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super Admins can view all demo leads" ON "public"."demo_leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'Super Admin'::"text")))));



CREATE POLICY "Super Admins can view all users" ON "public"."users" USING (("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"));



CREATE POLICY "Super Admins can view security audit logs" ON "public"."security_audit_log" USING (("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text"));



CREATE POLICY "System can insert demo leads" ON "public"."demo_leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert security audit logs" ON "public"."security_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert their own profile" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their profile (excluding role)" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND (("role")::"text" = (( SELECT "users_1"."role"
   FROM "public"."users" "users_1"
  WHERE ("users_1"."id" = "auth"."uid"())))::"text")));



CREATE POLICY "Users can view submissions in their network" ON "public"."submissions" FOR SELECT USING ((("partner_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = 'Super Admin'::"text") OR "public"."is_current_user_vendor_for_submission"("vendor_id")));



CREATE POLICY "Vendors can create submissions" ON "public"."submissions" FOR INSERT WITH CHECK ("public"."is_current_user_vendor_for_submission"("vendor_id"));



CREATE POLICY "Vendors can view resources from their partner" ON "public"."resources" FOR SELECT USING (("public"."get_vendor_partner_admin_id"("auth"."uid"()) = "partner_id"));



CREATE POLICY "Vendors can view their own profile" ON "public"."vendors" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Vendors can view their partner" ON "public"."partners" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'Vendor'::"text") AND ("public"."get_user_partner_id"("auth"."uid"()) = "id")));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_subscription_service_allowed" ON "public"."subscribers" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partners_own_data" ON "public"."partners" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_subscription_or_service" ON "public"."subscribers" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("email" = "auth"."email"()) OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."setup_fee_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_subscription_service_allowed" ON "public"."subscribers" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("email" = "auth"."email"()) OR ("auth"."role"() = 'service_role'::"text"))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("email" = "auth"."email"()) OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_audit_logs" ON "public"."storage_audit_log" TO "authenticated" USING (("partner_id" = "auth"."uid"())) WITH CHECK (("partner_id" = "auth"."uid"()));



ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendors_broker_access" ON "public"."vendors" TO "authenticated" USING ((("partner_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"()))) WITH CHECK ((("partner_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."admin_update_user_role"("target_user_id" "uuid", "new_role" "text", "reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_user_role"("target_user_id" "uuid", "new_role" "text", "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user_role"("target_user_id" "uuid", "new_role" "text", "reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_hybrid_storage_limit"("vendor_id" "uuid", "file_size" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_hybrid_storage_limit"("vendor_id" "uuid", "file_size" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_hybrid_storage_limit"("vendor_id" "uuid", "file_size" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_file_path"("broker_id" "uuid", "vendor_id" "uuid", "filename" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_file_path"("broker_id" "uuid", "vendor_id" "uuid", "filename" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_file_path"("broker_id" "uuid", "vendor_id" "uuid", "filename" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_partner_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_partner_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_partner_id"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vendor_partner_admin_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_vendor_partner_admin_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vendor_partner_admin_id"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_minimal"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_minimal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_minimal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_vendor_for_submission"("submission_vendor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_vendor_for_submission"("submission_vendor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_vendor_for_submission"("submission_vendor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "details" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "details" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "details" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_storage_limits_by_plan"("partner_id" "uuid", "plan_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_storage_limits_by_plan"("partner_id" "uuid", "plan_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_storage_limits_by_plan"("partner_id" "uuid", "plan_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_hybrid_storage_usage"("vendor_id" "uuid", "file_size" bigint, "is_delete" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_hybrid_storage_usage"("vendor_id" "uuid", "file_size" bigint, "is_delete" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_hybrid_storage_usage"("vendor_id" "uuid", "file_size" bigint, "is_delete" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_partner_storage"("partner_id" "uuid", "size_change" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_partner_storage"("partner_id" "uuid", "size_change" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_partner_storage"("partner_id" "uuid", "size_change" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_plan_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_plan_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_plan_limits"() TO "service_role";


















GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."demo_leads" TO "anon";
GRANT ALL ON TABLE "public"."demo_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_leads" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."setup_fee_payments" TO "anon";
GRANT ALL ON TABLE "public"."setup_fee_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."setup_fee_payments" TO "service_role";



GRANT ALL ON TABLE "public"."storage_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."storage_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."subscribers" TO "anon";
GRANT ALL ON TABLE "public"."subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
