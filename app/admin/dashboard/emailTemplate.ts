import type { Fiche } from '@/lib/types'

export function buildActivationEmail(fiche: Fiche): { subject: string; body: string } {
  const link = `https://badge.spoolio.fr/${fiche.token}/edit`

  if (fiche.type === 'enfant') {
    const name = fiche.data?.prenom || 'ton enfant'
    return {
      subject: `Active le badge SOS de ${name} 🏷️`,
      body: `Bonjour,

Le badge SOS de ${name} est prêt à être activé ! Ça prend 2 minutes :

1. Rends-toi sur ce lien : ${link}
2. Choisis un mot de passe et remplis les informations (contacts parentaux, infos médicales…)

Si tu as la moindre question, réponds directement à cet email.

À bientôt,
L'équipe Spoolio`,
    }
  }

  if (fiche.type === 'animal') {
    const name = fiche.data?.nom || 'ton animal'
    return {
      subject: `Active le badge SOS de ${name} 🐾`,
      body: `Bonjour,

Le badge SOS de ${name} est prêt à être activé ! Ça prend 2 minutes :

1. Rends-toi sur ce lien : ${link}
2. Choisis un mot de passe et remplis les informations (propriétaire, vétérinaire…)

Si tu as la moindre question, réponds directement à cet email.

À bientôt,
L'équipe Spoolio`,
    }
  }

  return {
    subject: 'Active ton badge SOS Spoolio 🏷️',
    body: `Bonjour,

Ton badge SOS Spoolio est prêt à être activé ! Ça prend 2 minutes :

1. Rends-toi sur ce lien : ${link}
2. Choisis un mot de passe et remplis tes informations (contacts d'urgence, infos médicales…)

Si tu as la moindre question, réponds directement à cet email.

À bientôt,
L'équipe Spoolio`,
  }
}
