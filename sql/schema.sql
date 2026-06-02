-- Fiches SOS festivaliers — Spoolio Badges
-- Exécuter dans l'éditeur SQL Supabase

create table if not exists fiches (
  id              uuid        primary key default gen_random_uuid(),
  token           text        unique not null,
  claim_code      text,                               -- null une fois utilisé
  password_hash   text,                               -- bcrypt, jamais en clair
  is_claimed      boolean     not null default false,
  data            jsonb       not null default '{}'::jsonb,
  failed_attempts integer     not null default 0,     -- tentatives de mdp échouées
  locked_until    timestamptz,                        -- verrouillée jusqu'à cette date
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists fiches_token_idx on fiches (token);

-- Trigger pour mettre à jour updated_at automatiquement
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger fiches_updated_at
  before update on fiches
  for each row execute function set_updated_at();

-- Activer RLS — aucune policy publique : seul le service_role passe
alter table fiches enable row level security;

-- Aucune policy : le service_role bypass RLS par défaut dans Supabase
-- Les clients web n'ont pas de clé anon → zéro accès direct possible
