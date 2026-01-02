-- =====================================================
-- PHASE 3A: ADD GAS ROLES TO ENUM
-- =====================================================

-- Add GAS-specific roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerencia_gas';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'logistica_gas';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cartera_gas';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'conductor_gas';