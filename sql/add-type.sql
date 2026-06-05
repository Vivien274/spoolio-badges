-- Ajouter la colonne type à la table fiches
-- Exécuter dans l'éditeur SQL Supabase

alter table fiches
  add column if not exists type text not null default 'festivalier';

-- Valeurs possibles : 'festivalier', 'enfant', 'animal'
-- Les fiches existantes héritent de la valeur par défaut 'festivalier'

-- Index optionnel si besoin de filtrer par type
create index if not exists fiches_type_idx on fiches (type);
