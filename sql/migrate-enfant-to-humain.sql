-- Migration des fiches "enfant" vers "humain"
-- Exécuter dans l'éditeur SQL Supabase
-- Cette migration est idempotente et non destructive :
-- Elle préserve toutes les données existantes (les anciennes clés tel_parent_* restent intactes dans data).

-- 1. Mettre à jour le type des fiches
update fiches
set type = 'humain'
where type = 'enfant';

-- 2. Dans le JSONB data, ajouter tel_contact_1 et tel_contact_2 à partir de tel_parent_1 et tel_parent_2 s'ils existent
update fiches
set data = data || jsonb_strip_nulls(jsonb_build_object(
  'tel_contact_1', coalesce(data->>'tel_contact_1', data->>'tel_parent_1'),
  'tel_contact_2', coalesce(data->>'tel_contact_2', data->>'tel_parent_2')
))
where type in ('humain', 'enfant')
  and (data ? 'tel_parent_1' or data ? 'tel_parent_2');
