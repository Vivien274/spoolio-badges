export type FicheType = 'festivalier' | 'enfant' | 'animal'

export interface FicheData {
  // ─ Commun ─
  ref?: string
  email?: string
  message?: string
  photo_url?: string
  photo_path?: string

  // ─ Festivalier ─
  prenom?: string
  intro?: string
  contact1_nom?: string
  contact1_tel?: string
  contact2_nom?: string
  contact2_tel?: string
  infos_medicales?: string
  groupe_sanguin?: string
  camping?: string
  langues?: string

  // ─ Enfant ─
  tel_parent_1?: string
  tel_parent_2?: string
  medical?: string   // aussi utilisé par animal

  // ─ Animal ─
  nom?: string
  type_animal?: string
  race?: string
  tel_proprio_1?: string
  tel_proprio_2?: string
  veto_nom?: string
  veto_adresse?: string
}

export interface Fiche {
  id: string
  token: string
  claim_code: string | null
  nfc_encoded_at: string | null
  password_hash: string | null
  type: FicheType
  is_claimed: boolean
  data: FicheData
  failed_attempts: number
  locked_until: string | null
  created_at: string
  updated_at: string
}

export interface ActionState {
  error?: string
  success?: boolean
  message?: string
}
