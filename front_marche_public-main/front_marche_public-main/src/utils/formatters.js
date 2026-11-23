export const roleKeys = {
  ADMIN: 'admin',
  AUTORITE_CONTRACTANTE: 'authority',
  FOURNISSEUR: 'supplier',
  COMMISSION_EVALUATION: 'commission',
  AUDITEUR: 'auditor',
}

export const roleLabels = {
  ADMIN: 'Administrateur',
  AUTORITE_CONTRACTANTE: 'Autorité contractante',
  FOURNISSEUR: 'Fournisseur',
  COMMISSION_EVALUATION: "Commission d’évaluation",
  AUDITEUR: 'Auditeur',
}

export const tenderStatusLabels = {
  BROUILLON: 'Brouillon',
  EN_VALIDATION: 'En validation',
  PUBLIE: 'Publié',
  CLOTURE: 'Clôturé',
  EN_OUVERTURE: 'En ouverture des plis',
  EN_EVALUATION: 'En cours d’évaluation',
  EN_ATTRIBUTION: 'En attribution',
  ATTRIBUE: 'Attribué',
  ANNULE: 'Annulé',
  ARCHIVE: 'Archivé',
}

export const offerStatusLabels = {
  BROUILLON: 'Brouillon',
  DEPOSEE: 'Déposée',
  OUVERT: 'Ouvert en séance',
  SCELLEE: 'En attente d’ouverture',
  EN_EVALUATION: 'En évaluation',
  EN_COURS_EVALUATION: 'En cours d’évaluation',
  CONFORME: 'Conforme',
  NON_CONFORME: 'Non conforme',
  ACCEPTEE: 'Acceptée',
  REJETEE: 'Rejetée',
  ATTRIBUEE: 'Attribuée',
  PERDUE: 'Non retenue',
}

export const marketTypeLabels = {
  FOURNITURES: 'Fournitures',
  SERVICES: 'Services',
  TRAVAUX: 'Travaux',
  PRESTATIONS_INTELLECTUELLES: 'Prestations intellectuelles',
  MAINTENANCE: 'Maintenance',
  INFORMATIQUE: 'Informatique',
  EQUIPEMENTS: 'Équipements',
}

export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(amount)} FCFA`
}

export function displayReference(value) {
  if (value == null || value === '') return '—'
  const text = String(value)
  const uuidPattern = '[\\da-f]{8}-[\\da-f]{4}-[\\da-f]{4}-[\\da-f]{4}-[\\da-f]{12}'
  if (new RegExp(uuidPattern, 'i').test(text)) return text.replace(new RegExp(uuidPattern, 'ig'), (uuid) => uuid.slice(0, 8).toUpperCase())
  if (/^[\da-f]{40,}$/i.test(text)) return `${text.slice(0, 8)}…${text.slice(-4)}`
  return text
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-SN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
}

export function toTenderView(tender) {
  const title = tender.title || tender.titre || ''
  const type = tender.typeMarche || String(tender.type || '').toUpperCase()
  return {
    ...tender,
    id: String(tender.id),
    title,
    description: tender.description,
    authority: tender.auteur?.nom || tender.creator?.firstName && `${tender.creator.firstName} ${tender.creator.lastName || ''}`.trim() || 'Autorité contractante',
    type: marketTypeLabels[type] || type,
    budget: formatMoney(tender.budgetEstimatif),
    deadline: formatDate(tender.dateLimiteSoumission || tender.submissionDeadline),
    published: formatDate(tender.publishedAt || tender.updatedAt || tender.createdAt),
    status: tenderStatusLabels[tender.statut] || tenderStatusLabels[String(tender.status || '').toUpperCase()] || tender.status || tender.statut,
  }
}
