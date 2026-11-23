import { ArrowUpRight, FileStack, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, SearchFilter } from '../components/ui'
import { useApp } from '../context/useApp'
import { offerService } from '../services/offerService'
import { tenderService } from '../services/tenderService'
import { displayReference, formatDate, formatMoney, initials, offerStatusLabels } from '../utils/formatters'

function presentOffer(offer, fallbackUser) {
  return {
    ...offer,
    supplier: offer.fournisseur?.nom || fallbackUser?.name || 'Fournisseur',
    tenderId: String(offer.appelOffresId || offer.appelOffres?.id || ''),
    tenderTitle: offer.appelOffres?.titre || '',
    amount: formatMoney(offer.montantPropose),
    date: formatDate(offer.dateSoumission, { hour: '2-digit', minute: '2-digit' }),
    status: offerStatusLabels[offer.statut] || offer.statut,
    documentCount: offer.documents?.length || 0,
  }
}

function RoleSubmissions({ rows, search, setSearch, loading, error, role }) {
  const [statusFilter, setStatusFilter] = useState('TOUTES')
  const isSupplier = role === 'supplier'
  const statusCounts = {
    TOUTES: rows.length,
    À_TRAITER: rows.filter((item) => ['SOUMISE', 'EN_COURS_EVALUATION', 'SCELLEE'].includes(item.statut)).length,
    ACCEPTEE: rows.filter((item) => item.statut === 'ACCEPTEE').length,
    REJETEE: rows.filter((item) => item.statut === 'REJETEE').length,
  }
  const cards = rows.filter((item) => statusFilter === 'TOUTES'
    || (statusFilter === 'À_TRAITER' && ['SOUMISE', 'EN_COURS_EVALUATION', 'SCELLEE'].includes(item.statut))
    || item.statut === statusFilter)
  const compliant = rows.filter((item) => item.isCompliant === true || item.statut === 'ACCEPTEE').length
  const pricedOffers = rows.filter((item) => (isSupplier || !(item.isSealed || item.statut === 'SCELLEE')) && Number.isFinite(Number(item.montantPropose)))
  const averageAmount = pricedOffers.length ? pricedOffers.reduce((sum, item) => sum + Number(item.montantPropose), 0) / pricedOffers.length : null
  const rejected = rows.filter((item) => String(item.statut || '').toUpperCase() === 'REJETEE').length
  const pending = rows.filter((item) => ['SOUMISE', 'EN_COURS_EVALUATION', 'SCELLEE'].includes(item.statut)).length
  const analyzed = rows.filter((item) => item.analyzedAt || item.score?.globalScore != null).length
  const title = isSupplier ? 'Mes soumissions' : role === 'commission' ? 'Dossiers à examiner' : role === 'auditor' ? 'Soumissions à contrôler' : 'Soumissions reçues'
  const description = isSupplier
    ? 'Suivez vos offres, consultez leur statut et retrouvez les informations de dépôt.'
    : role === 'commission'
      ? 'Consultez les offres reçues et poursuivez leur examen.'
      : role === 'auditor'
        ? 'Consultez les dossiers, les analyses enregistrées et les éléments à contrôler.'
        : 'Retrouvez les offres déposées pour les marchés dont vous avez la charge.'
  const actionLabel = isSupplier ? 'Nouvelle offre' : role === 'commission' ? 'Analyser' : role === 'auditor' ? 'Contrôler' : 'Examiner'
  const stats = isSupplier
    ? [
        ['OFFRES DÉPOSÉES', rows.length, 'Total de vos offres'],
        ['À TRAITER', pending, 'En attente ou en cours'],
        ['RETENUES', rows.filter((item) => item.statut === 'ACCEPTEE').length, 'Décisions favorables'],
        ['REJETÉES', rejected, 'Décisions défavorables'],
      ]
    : role === 'auditor'
      ? [
          ['TOTAL REÇU', rows.length, 'Dossiers consultables'],
          ['ANALYSES', analyzed, 'Analyses enregistrées'],
          ['À CONTRÔLER', pending, 'Dossiers en cours'],
          ['REJETÉES', rejected, 'Décisions défavorables'],
        ]
      : role === 'commission'
        ? [
            ['TOTAL REÇU', rows.length, 'Soumissions déposées'],
            ['CONFORMES', compliant, `${rows.length ? Math.round((compliant / rows.length) * 100) : 0}% des dossiers`],
            ['À EXAMINER', pending, 'Analyse ou vérification à poursuivre'],
            ['REJETÉES', rejected, 'Décisions enregistrées'],
          ]
        : [
            ['TOTAL REÇU', rows.length, 'Soumissions déposées'],
            ['CONFORMES', compliant, `${rows.length ? Math.round((compliant / rows.length) * 100) : 0}% des dossiers`],
            ['MONTANT MOYEN', averageAmount == null ? '—' : formatMoney(averageAmount), `${pricedOffers.length} offre(s) chiffrée(s)`],
            ['REJETÉES', rejected, 'Décisions enregistrées'],
          ]
  const filters = isSupplier
    ? [['TOUTES', 'Toutes'], ['À_TRAITER', 'À traiter'], ['ACCEPTEE', 'Retenues'], ['REJETEE', 'Rejetées']]
    : [['TOUTES', 'Toutes'], ['À_TRAITER', role === 'commission' ? 'À examiner' : 'En cours'], ['ACCEPTEE', 'Acceptées'], ['REJETEE', 'Rejetées']]

  return <div className="received-submissions-page">
    <div className="received-submissions-page__breadcrumb">ESPACE DE TRAVAIL <span>/</span> <b>{title}</b></div>
    <header className="received-submissions-page__hero"><div><span className="eyebrow">{isSupplier ? 'ESPACE FOURNISSEUR' : 'SUIVI DES CANDIDATURES'}</span><h1>{title}</h1><p>{description}</p></div><div className="received-submissions-page__hero-actions">{isSupplier && <Link className="authority-btn authority-btn--dark" to="/app/soumissions/nouvelle"><Plus size={15}/> Nouvelle offre</Link>}<div className="received-submissions-page__total"><FileStack size={20}/><b>{rows.length}</b><span>{isSupplier ? 'offres' : 'dossiers'}</span></div></div></header>
    <div className="received-submissions-page__stats">{stats.map(([label, value, hint]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>
    {!isSupplier && role === 'commission' && pending > 0 && <Link to="/app/analyse" className="received-submissions-page__priority"><span><TriangleAlert size={18}/></span><div><b>{pending} dossier(s) demandent un suivi</b><small>Ouvrez la file d’analyse pour poursuivre leur examen.</small></div><ArrowUpRight size={17}/></Link>}
    <section className="received-submissions-page__list"><header><div><h2>Liste des dossiers</h2><p>{cards.length} résultat(s) · recherchez par fournisseur, référence ou marché.</p></div><SearchFilter value={search} onChange={setSearch} placeholder="Rechercher une soumission…" /></header>
      <nav className="received-submissions-page__filters" aria-label="Filtrer les soumissions par statut">{filters.map(([value,label])=><button key={value} className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)} type="button">{label}<span>{statusCounts[value]}</span></button>)}</nav>
      <div className="received-submissions-page__cards">{loading ? <p className="received-submissions-page__empty">Chargement des soumissions…</p> : error ? <p className="received-submissions-page__empty">Impossible de charger les soumissions : {error}</p> : cards.map((item)=>{
        const sealed = !isSupplier && Boolean(item.isSealed || item.statut === 'SCELLEE')
        const supplier = sealed ? 'Identité confidentielle' : item.supplier || 'Fournisseur'
        const statusTone = item.statut === 'ACCEPTEE' ? 'green' : item.statut === 'REJETEE' ? 'red' : sealed ? 'orange' : item.statut === 'EN_COURS_EVALUATION' ? 'orange' : 'blue'
        const target = role === 'commission' ? `/app/analyse/${item.tenderId}` : `/app/soumissions/${item.id}`
        const resumeDraft = isSupplier && item.statut === 'BROUILLON'
        const linkTarget = resumeDraft ? `/app/soumissions/nouvelle?brouillon=${item.id}` : target
        const linkLabel = resumeDraft ? 'Reprendre' : isSupplier ? 'Voir mon offre' : actionLabel
        const primaryLabel = isSupplier ? 'VOTRE OFFRE' : 'SOUMISSIONNAIRE'
        return <article className="received-submission-card" key={item.id}>
          <div className="received-submission-card__main"><div className="received-submission-card__identity"><span className="received-submission-card__avatar">{sealed ? '••' : initials(isSupplier ? item.tenderTitle || 'Offre' : supplier)}</span><div><small className="received-submission-card__context">{primaryLabel}</small><b>{isSupplier ? `Offre ${displayReference(item.id)}` : supplier}</b><small>{isSupplier ? `Déposée le ${item.date}` : `Offre ${displayReference(item.id)} · ${item.date}`}</small></div></div><Badge tone={statusTone}>{sealed ? 'Offre non ouverte' : item.status || 'Soumise'}</Badge></div>
          <div className="received-submission-card__market"><span>APPEL D’OFFRES · AO-{displayReference(item.tenderId || item.tender)}</span><b title={item.tenderTitle}>{item.tenderTitle || `Appel d’offres ${displayReference(item.tenderId || item.tender)}`}</b></div>
          <div className="received-submission-card__facts"><div><small>{isSupplier ? 'MONTANT DE VOTRE OFFRE' : 'MONTANT PROPOSÉ'}</small><b>{sealed ? 'Confidentiel' : item.amount || formatMoney(item.montantPropose)}</b></div><div><small>{isSupplier ? 'DOCUMENTS JOINTS' : 'DÉLAI PRÉVU'}</small><b>{isSupplier ? `${item.documentCount} pièce(s)` : sealed ? '—' : item.delaiExecutionJours ? `${item.delaiExecutionJours} jours` : '—'}</b></div></div>
          <Link className="received-submission-card__action" to={linkTarget}><span>{linkLabel}</span><ArrowUpRight size={15}/></Link>
        </article>
      })}{!loading && !error && cards.length === 0 && <p className="received-submissions-page__empty">Aucun dossier ne correspond à cette recherche ou à ces filtres.</p>}</div>
    </section>
  </div>
}

export default function SubmissionsPage() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { role, user } = useApp()

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        let offers
        if (role === 'supplier') {
          offers = await offerService.mine()
        } else {
          let tenders = await tenderService.list()
          if (role === 'authority') tenders = tenders.filter((tender) => tender.createdById === user.id)
          const results = await Promise.allSettled(tenders.map((tender) => offerService.byTender(tender.id)))
          offers = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        }
        if (active) setRows(offers.map((offer) => presentOffer(offer, user)))
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [role, user?.id])

  const filtered = useMemo(() => rows.filter((item) =>
    `${item.supplier} ${item.id} ${item.tenderId} ${item.tenderTitle}`.toLowerCase().includes(search.toLowerCase()),
  ), [rows, search])

  return <RoleSubmissions rows={filtered} search={search} setSearch={setSearch} loading={loading} error={error} role={role} />
}
