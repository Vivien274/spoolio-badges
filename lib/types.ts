export interface FicheData {
  prenom?: string
  intro?: string
  photo_url?: string
  photo_path?: string
  contact1_nom?: string
  contact1_tel?: string
  contact2_nom?: string
  contact2_tel?: string
  infos_medicales?: string
  groupe_sanguin?: string
  camping?: string
  langues?: string
  message?: string
}

export interface Fiche {
  id: string
  token: string
  claim_code: string | null
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
