alter table fiches
  add column if not exists nfc_encoded_at timestamptz;
