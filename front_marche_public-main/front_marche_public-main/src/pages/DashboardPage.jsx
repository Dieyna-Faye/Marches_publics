import { AlertTriangle, Archive, ArrowUpRight, Bell, BriefcaseBusiness, CircleDollarSign, FileStack, Megaphone, Send, ShieldAlert, Sparkles, UsersRound, WalletCards } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, EmptyState, LinkAction, SectionCard } from '../components/ui'
import { useApp } from '../context/useApp'
import { dashboardService } from '../services/dashboardService'
import { offerService } from '../services/offerService'
import { tenderService } from '../services/tenderService'
import { displayReference, formatMoney, toTenderView } from '../utils/formatters'

function DashboardMetricCards({ items }) {
  return <div className="dashboard-metrics">{items.map((item) => {
    const [, label, value, helper, tone = 'blue'] = item
    return <article className="dashboard-metric-card" data-tone={tone} key={label}>
      <span>{label}</span><strong>{value}</strong><small>{helper}</small>
    </article>
  })}</div>
}

const copyByRole = {
  admin: { title: 'Vue d’ensemble de la plateforme', description: 'Indicateurs fournis par le backend MVP1.' },
  authority: { title: 'Pilotage de vos marchés', description: 'Suivez les appels d’offres et les offres reçues.' },
  supplier: { title: 'Votre espace fournisseur', description: 'Retrouvez les opportunités publiées et vos soumissions.' },
  commission: { title: 'Espace de la commission', description: 'Consultez les appels d’offres et les soumissions accessibles.' },
  auditor: { title: 'Tableau de bord d’audit', description: 'Consultez les indicateurs disponibles dans le MVP1.' },
}

function ReceivedOffersPanel({ offers = [], tenders = [], title = 'Soumissions reçues', subtitle = 'Suivez les dossiers déposés et leur état de traitement.', role, limit = 5, emptyMessage = 'Aucune soumission reçue pour le moment.' }) {
  const sortedOffers = role === 'commission'
    ? [...offers]
    : [...offers].sort((left, right) => new Date(right.dateSoumission || right.createdAt || 0) - new Date(left.dateSoumission || left.createdAt || 0))
  const visibleOffers = sortedOffers.slice(0, limit)
  const dateFormatter = new Intl.DateTimeFormat('fr-SN', { dateStyle: 'medium' })
  const tenderTitle = (offer) => offer.appelOffres?.titre || tenders.find((item) => String(item.id) === String(offer.appelOffresId))?.title || `Appel d’offres AO-${displayReference(offer.appelOffresId)}`
  const statusTone = (offer) => offer.isSealed || offer.statut === 'SCELLEE' ? 'orange' : offer.statut === 'ACCEPTEE' ? 'green' : offer.statut === 'REJETEE' ? 'red' : 'blue'
  const statusLabel = (offer) => offer.isSealed || offer.statut === 'SCELLEE'
    ? role === 'commission' ? 'À ouvrir' : 'Non ouverte'
    : (offer.statut || 'EN_COURS').replaceAll('_', ' ')

  return <section className="received-offers">
    <header><div><span className="eyebrow">SUIVI DES DOSSIERS</span><h2>{title}</h2><p>{subtitle}</p></div><Link to="/app/soumissions">Tout voir <ArrowUpRight size={15}/></Link></header>
    <div className="received-offers__list">{visibleOffers.map((offer) => {
      const sealed = Boolean(offer.isSealed || offer.statut === 'SCELLEE')
      const target = role === 'commission' ? `/app/analyse/${offer.appelOffresId}` : `/app/soumissions/${offer.id}`
      const action = role === 'commission' ? (sealed ? 'Ouvrir les plis' : 'Traiter le dossier') : 'Consulter'
      const dateValue = offer.dateSoumission || offer.createdAt
      const date = dateValue && !Number.isNaN(new Date(dateValue).getTime()) ? dateFormatter.format(new Date(dateValue)) : 'Date non renseignée'
      return <article className="received-offer" key={offer.id}>
        <div className="received-offer__identity"><div className="received-offer__topline"><b>OFFRE-{displayReference(offer.reference || offer.id)}</b><Badge tone={statusTone(offer)}>{statusLabel(offer)}</Badge></div><h3>{tenderTitle(offer)}</h3><p>{sealed ? 'Identité du fournisseur masquée jusqu’à l’ouverture' : (offer.fournisseur?.nom || offer.fournisseur?.name || 'Fournisseur non renseigné')}</p></div>
        <div className="received-offer__meta"><span><small>DATE DE DÉPÔT</small><b>{date}</b></span><span><small>MONTANT PROPOSÉ</small><b>{sealed ? 'Confidentiel' : formatMoney(offer.montantPropose)}</b></span></div>
        <Link className="received-offer__action" to={target}>{action}<ArrowUpRight size={14}/></Link>
      </article>
    })}{visibleOffers.length === 0 && <p className="received-offers__empty">{emptyMessage}</p>}</div>
  </section>
}

function AdminDashboard({ summary, user, tenders, offers }) {
  const firstName = (user?.name || 'Alexandre').split(' ')[0].toUpperCase()
  const adminStats = [
    [Send, 'Soumissions', summary?.nombreOffresRecues ?? 0, 'Offres enregistrées', 'navy'],
    [BriefcaseBusiness, 'Appels publiés', summary?.appelsOffresPublies ?? 0, 'Procédures ouvertes', 'blue'],
    [UsersRound, 'Fournisseurs', summary?.nombreFournisseursInscrits ?? 0, 'Comptes enregistrés', 'ice'],
    [AlertTriangle, 'Brouillons', summary?.appelsOffresBrouillon ?? 0, 'À finaliser', 'cream'],
  ]
  const activeMarkets = tenders.slice(0, 3).map((tender) => ({
    title: tender.title,
    amount: tender.budget,
    status: tender.status,
    deadline: tender.deadline,
  }))
  const monthly = summary?.monthlySubmissions || []
  const maxMonthly = Math.max(1, ...monthly.map((item) => item.count))
  const chartPoints = monthly.map((item, index) => `${monthly.length < 2 ? 350 : index * 700 / (monthly.length - 1)},${220 - item.count / maxMonthly * 175}`)
  const chartLine = chartPoints.length > 1 ? `M${chartPoints.join(' L')}` : ''
  const chartArea = chartLine ? `${chartLine} L700 235 L0 235 Z` : ''

  return <div className="admin-dashboard">
    <header className="admin-dashboard__welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
      <div>
        <h1>Bonjour, {firstName}</h1>
        <p>Analysez toutes les offres de la plateforme, supervisez les comptes et pilotez les marchés publics.</p>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link to="/app/utilisateurs" className="btn btn--outline" style={{ fontSize: '13px' }}>
          <UsersRound size={15} /> Utilisateurs
        </Link>
      </div>
    </header>

    <section className="admin-ai"><span><Sparkles size={20}/></span><div className="admin-ai__intro"><b>Aperçu Intelligent ProcureAI</b><small>Données actualisées</small></div><article><b>ACTIVITÉ</b><p>{summary?.nombreOffresRecues ?? 0} offre(s) reçue(s) sur {summary?.nombreAppelsOffres ?? 0} procédure(s).</p></article><article><b>PARTICIPATION</b><p>Moyenne réelle de {summary?.tauxParticipationMoyen ?? 0} offre(s) par appel publié.</p></article><article><b>SUIVI</b><p>{summary?.appelsOffresBrouillon ?? 0} appel(s) d’offres restent à finaliser.</p></article></section>

    <div className="admin-dashboard__main">
      <div className="admin-stats">{adminStats.map(([Icon,label,value,helper,tone])=><article className={`admin-stat admin-stat--${tone}`} key={label}><header><span>{label}</span><i><Icon size={17}/></i></header><strong>{value}</strong><small>{helper}</small></article>)}</div>
      <section className="admin-chart"><header><div><h2>Offres déposées</h2><p>Historique réel des six derniers mois</p></div><Link to="/app/soumissions">Consulter les offres <ArrowUpRight size={13}/></Link></header><div className="admin-chart__plot"><div className="admin-chart__y"><span>{maxMonthly}</span><span>{Math.round(maxMonthly * .75)}</span><span>{Math.round(maxMonthly * .5)}</span><span>{Math.round(maxMonthly * .25)}</span><span>0</span></div><svg viewBox="0 0 700 235" preserveAspectRatio="none" aria-label="Nombre d’offres réellement déposées par mois"><defs><linearGradient id="adminArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#567c8d" stopOpacity=".28"/><stop offset="1" stopColor="#567c8d" stopOpacity="0"/></linearGradient></defs>{chartLine && <><path className="admin-chart__area" d={chartArea}/><path className="admin-chart__line" d={chartLine}/></>}</svg><div className="admin-chart__months">{monthly.map((item, index)=><span key={`${item.month}-${index}`}>{item.month}</span>)}</div></div></section>
    </div>

    <ReceivedOffersPanel offers={offers} tenders={tenders} title="Soumissions reçues" subtitle="Les dépôts les plus récents sur l’ensemble de la plateforme." role="admin" />
    <section className="admin-markets"><header><div><h2>Appels d’offres récents</h2><p>Statut, budget et échéance issus de la base</p></div><CircleDollarSign size={19}/></header><div>{activeMarkets.map(({title,amount,status,deadline})=><article key={title}><span className="admin-market__tag">{status}</span><div className="admin-market__line"><b>{title}</b><strong>{amount}</strong></div><small><span>Date limite : {deadline}</span><span>{status}</span></small></article>)}{activeMarkets.length === 0 && <p className="empty-copy">Aucun appel d’offres enregistré.</p>}</div></section>
  </div>
}

function SupplierDashboard({ summary, user, tenders, offers }) {
  const firstName = user?.name || 'Fournisseur'
  const submitted = summary?.nombreSoumissions ?? offers.filter((offer) => ['SOUMISE', 'EN_COURS_EVALUATION', 'ACCEPTEE', 'REJETEE'].includes(offer.statut)).length
  const accepted = summary?.soumissionsAcceptees ?? offers.filter((offer) => offer.statut === 'ACCEPTEE').length
  const evaluating = summary?.soumissionsEnEvaluation ?? offers.filter((offer) => offer.statut === 'EN_COURS_EVALUATION').length
  const rejected = summary?.soumissionsRejetees ?? offers.filter((offer) => offer.statut === 'REJETEE').length
  const statusTotal = Math.max(1, submitted)
  const recentOffers = offers.slice(0, 5)
  const monthCounts = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - offset))
    const count = offers.filter((offer) => {
      const offerDate = new Date(offer.dateSoumission || offer.createdAt)
      return offerDate.getMonth() === date.getMonth() && offerDate.getFullYear() === date.getFullYear()
    }).length
    return { label: new Intl.DateTimeFormat('fr-SN', { month: 'short' }).format(date), count }
  })
  const maxCount = Math.max(1, ...monthCounts.map((item) => item.count))
  const openTenders = tenders.filter((tender) => tender.status === 'Publié')
  const draftOffers = offers.filter((offer) => ['BROUILLON', 'EN_COURS'].includes(offer.statut))
  const nextAction = draftOffers.length
    ? { title: 'Reprenez une candidature en cours', text: `${draftOffers.length} dossier(s) attendent votre finalisation.`, label: 'Voir mes candidatures', to: '/app/soumissions' }
    : openTenders.length
      ? { title: 'Une opportunité vous attend', text: `${openTenders.length} marché(s) sont actuellement ouverts aux candidatures.`, label: 'Parcourir les marchés', to: '/app/appels-offres' }
      : { title: 'Suivez vos dossiers', text: 'Consultez l’avancement et les décisions sur vos offres déposées.', label: 'Voir mes candidatures', to: '/app/soumissions' }

  return <div className="supplier-dashboard">
    <header className="supplier-dashboard__head"><div><span className="eyebrow">ESPACE FOURNISSEUR</span><h1>Bonjour, {firstName}</h1><p>Retrouvez vos candidatures et les marchés ouverts à votre entreprise.</p></div></header>

    <section className="supplier-next-action"><div className="supplier-next-action__icon"><Sparkles size={21}/></div><div><span className="eyebrow">PROCHAINE ACTION</span><h2>{nextAction.title}</h2><p>{nextAction.text}</p></div><Link className="btn btn--primary" to={nextAction.to}>{nextAction.label}<ArrowUpRight size={16}/></Link></section>

    <DashboardMetricCards items={[
      [Send, 'OFFRES SOUMISSIONNÉES', submitted, 'Dossiers déposés'],
      [Sparkles, 'EN COURS D’ANALYSE', evaluating, 'Soumissions examinées'],
      [FileStack, 'OFFRES ACCEPTÉES', accepted, 'Décisions favorables'],
      [ShieldAlert, 'OFFRES REJETÉES', rejected, 'Décisions défavorables', 'red'],
    ]} />

    <div className="supplier-dashboard__charts">
      <section className="supplier-evolution"><header><h2>Évolution des soumissions</h2><span><i /> Candidatures</span></header><div className="supplier-bars">{monthCounts.map((item) => <div key={item.label}><i style={{ height: `${Math.max(3, item.count / maxCount * 100)}%` }} /><span>{item.label}</span></div>)}</div></section>
      <section className="supplier-status"><h2>Répartition par statut</h2><div className="supplier-donut" style={{ background: `conic-gradient(#2f4156 0 ${evaluating / statusTotal * 100}%, #567c8d ${evaluating / statusTotal * 100}% ${(evaluating + accepted) / statusTotal * 100}%, #dbe6ea ${(evaluating + accepted) / statusTotal * 100}% 100%)` }}><span><b>{submitted}</b><small>TOTAL OFFRES</small></span></div><ul><li><i /> En cours <b>{evaluating}</b></li><li><i /> Acceptées <b>{accepted}</b></li><li><i /> Autres <b>{Math.max(0, submitted - evaluating - accepted)}</b></li></ul></section>
    </div>

    <div className="supplier-dashboard__bottom">
      <ReceivedOffersPanel offers={recentOffers} tenders={tenders} title="Mes dernières soumissions" subtitle="Retrouvez rapidement l’état de vos candidatures." role="supplier" emptyMessage="Aucune candidature déposée." />
      <aside className="supplier-notifications"><header><h2>Notifications</h2><Bell size={15} /></header><article className="is-blue"><b>{tenders.length} marché(s) disponible(s)</b><p>Consultez les opportunités ouvertes correspondant à votre activité.</p><Link to="/app/appels-offres">Voir les marchés</Link></article>{evaluating > 0 && <article className="is-orange"><b>Évaluation en cours</b><p>{evaluating} dossier(s) sont actuellement examinés.</p><Link to="/app/soumissions">Suivre mes offres</Link></article>}<article><b>Documents déposés</b><p>{summary?.documentsDeposes ?? offers.reduce((total, offer) => total + (offer.documents?.length || 0), 0)} pièce(s) enregistrée(s).</p><Link to="/app/documents">Voir mes documents</Link></article></aside>
    </div>
  </div>
}

function CommissionDashboard({ tenders, offers, user }) {
  const firstName = user?.name || 'Commission'
  const pendingDocuments = offers.flatMap((offer) => (offer.documents || []).filter((document) => !['conforme', 'non_conforme'].includes(document.reviewStatus)).map((document) => ({ ...document, bid: offer })))
  const waitingAnalysis = offers.filter((offer) => !offer.analyzedAt)
  const waitingDecision = offers.filter((offer) => !offer.committeeDecision && !offer.isSealed && offer.statut !== 'SCELLEE')
  const sealedOffers = offers.filter((offer) => offer.isSealed || offer.statut === 'SCELLEE')
  const orderedOffers = [...offers].sort((left, right) => {
    // Les offres scellées et les offres à analyser en premier
    const leftWeight = (left.isSealed || left.statut === 'SCELLEE') ? 2 : !left.analyzedAt ? 1 : 0
    const rightWeight = (right.isSealed || right.statut === 'SCELLEE') ? 2 : !right.analyzedAt ? 1 : 0
    return rightWeight - leftWeight || new Date(right.dateSoumission || right.createdAt) - new Date(left.dateSoumission || left.createdAt)
  })
  const stats = [
    [FileStack, 'Offres non ouvertes', sealedOffers.length, 'À ouvrir avant leur analyse', 'blue'],
    [FileStack, 'Documents à vérifier', pendingDocuments.length, 'Vérification à faire', 'navy'],
    [Sparkles, 'Offres à analyser', waitingAnalysis.length, 'Analyse à faire', 'green'],
    [ShieldAlert, 'Décisions à prendre', waitingDecision.length, 'Décision à rendre', 'orange'],
  ]
  return <div className="dashboard-page commission-dashboard">
    <header className="dashboard-welcome"><div><span className="eyebrow">ESPACE COMMISSION</span><h1>Bonjour, {firstName}</h1><p>Traitez les pièces, enregistrez vos notes et motivez chaque décision. Les actions de la commission sont conservées dans le journal d’audit.</p></div><div className="dashboard-welcome__actions"><Link className="btn btn--primary" to="/app/analyse">Ouvrir l’analyse approfondie</Link></div></header>
    <DashboardMetricCards items={stats} />
    <ReceivedOffersPanel offers={orderedOffers} tenders={tenders} title="File de travail de la commission" subtitle="Les dépôts récents et les dossiers à traiter sont regroupés ici." role="commission" limit={12} emptyMessage="Aucune offre déposée. Les offres apparaîtront ici dès leur dépôt." />
  </div>
}

function AuthorityDashboard({ summary, user, tenders, offers }) {
  const firstName = user?.name || 'Autorité'
  const published = tenders.filter((t) => t.status === 'Publié').length
  const drafts = tenders.filter((t) => t.status === 'Brouillon' || t.status === 'En validation').length
  const inEval = tenders.filter((t) => t.status === 'En cours d’évaluation' || t.status === 'Clôturé').length
  const awarded = tenders.filter((t) => t.status === 'Attribué').length

  const stats = [
    [BriefcaseBusiness, 'Procédures actives', published, 'Appels ouverts aux soumissions', 'navy'],
    [Send, 'Plis enregistrés', offers.length, 'Offres reçues sur vos marchés', 'blue'],
    [FileStack, 'En évaluation / Clôturés', inEval, 'Prêts pour ouverture ou notation', 'orange'],
    [CircleDollarSign, 'Marchés attribués', awarded, 'Contrats finalisés', 'green'],
  ]

  return (
    <div className="dashboard-page authority-dashboard">
      <header className="dashboard-welcome">
        <div>
          <span className="eyebrow">ESPACE AUTORITÉ CONTRACTANTE</span>
          <h1>Bonjour, {firstName}</h1>
          <p>Supervisez vos marchés publics, de la rédaction du cahier des charges jusqu’à l’attribution finale.</p>
        </div>
        <div className="dashboard-welcome__actions">
          <Link className="btn btn--primary" to="/app/appels-offres/nouveau">
            + Nouvel appel d’offres
          </Link>
          <Link className="btn btn--outline" to="/app/appels-offres">
            Tous mes marchés
          </Link>
        </div>
      </header>

      <DashboardMetricCards items={stats} />

      <ReceivedOffersPanel offers={offers} tenders={tenders} title="Soumissions reçues" subtitle="Les dernières offres déposées sur vos marchés." role="authority" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '24px' }}>
        <SectionCard title="Mes procédures en cours" subtitle="État d’avancement de vos marchés dans le cycle de passation" action={<LinkAction to="/app/appels-offres" />}>
          <div className="deadline-list">
            {tenders.slice(0, 6).map((tender) => (
              <Link key={tender.id} to={`/app/appels-offres/${tender.id}`}>
                <span className="deadline-date"><b>AO</b><small>{displayReference(tender.id)}</small></span>
                <div><b>{tender.title}</b><small>{tender.budget} · Date limite : {tender.deadline}</small></div>
                <Badge tone={tender.status === 'Publié' ? 'green' : tender.status === 'Brouillon' ? 'orange' : tender.status === 'Attribué' ? 'ice' : 'blue'}>
                  {tender.status}
                </Badge>
              </Link>
            ))}
            {tenders.length === 0 && <p className="empty-copy">Aucun appel d’offres créé.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Actions prioritaires" subtitle="Interventions requises sur vos dossiers">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {drafts > 0 && (
              <div style={{ padding: '14px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
                <strong>{drafts} appel(s) en préparation ou validation</strong>
                <p style={{ margin: '4px 0 8px', fontSize: '13px' }}>Finalisez le cahier des charges et publiez vos opportunités.</p>
                <Link to="/app/appels-offres" style={{ fontWeight: 700, fontSize: '13px', color: '#b45309' }}>Consulter les brouillons →</Link>
              </div>
            )}
            {inEval > 0 && (
              <div style={{ padding: '14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                <strong>{inEval} marché(s) en dépouillement ou évaluation</strong>
                <p style={{ margin: '4px 0 8px', fontSize: '13px' }}>La commission est responsable de l’ouverture et de l’analyse des plis. Vous pouvez suivre l’état de ces procédures.</p>
                <Link to="/app/appels-offres" style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb' }}>Suivre les évaluations →</Link>
              </div>
            )}
            <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
              <strong>Assistance IA & Traçabilité</strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Chaque soumission dispose d’un récépissé SHA-256 et chaque note est enregistrée dans le journal d’audit.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

function AuditorDashboard({ summary, user, tenders, offers }) {
  const firstName = user?.name || 'Auditeur'
  const totalTenders = tenders.length
  const alertsCount = summary?.kpis?.alertesOuvertes ?? 0
  const complianceRate = summary?.kpis?.tauxConformite ?? 100
  const totalContracts = summary?.kpis?.appelOffresAttribues ?? tenders.filter((t) => t.status === 'Attribué').length

  const stats = [
    [Megaphone, 'Procédures sous revue', totalTenders, 'Appels d’offres surveillés', 'navy'],
    [ShieldAlert, 'Alertes d’anomalie IA', alertsCount, 'Signaux à vérifier (prix / collusion)', alertsCount > 0 ? 'orange' : 'green'],
    [Sparkles, 'Taux de conformité', `${complianceRate}%`, 'Conformité administrative des plis', 'blue'],
    [CircleDollarSign, 'Marchés attribués', totalContracts, 'Décisions enregistrées', 'green'],
  ]

  return (
    <div className="dashboard-page auditor-dashboard">
      <header className="dashboard-welcome">
        <div>
          <span className="eyebrow">ESPACE CONTRÔLE DE RÉGULARITÉ & AUDIT</span>
          <h1>Bonjour, {firstName}</h1>
          <p>Consultez les procédures, les alertes disponibles et les événements consignés dans le journal d’audit.</p>
        </div>
        <div className="dashboard-welcome__actions">
          <Link className="btn btn--primary" to="/app/audit">
            Consulter le journal d’audit
          </Link>
          <Link className="btn btn--outline" to="/app/fraudes">
            Alertes de risque IA
          </Link>
        </div>
      </header>

      <DashboardMetricCards items={stats} />

      <ReceivedOffersPanel offers={offers} tenders={tenders} title="Soumissions à contrôler" subtitle="Consultez les dépôts récents dans le périmètre de contrôle." role="auditor" />

      <div className="auditor-dashboard__lower">
        <SectionCard title="Surveillance des procédures" subtitle="Procédures récentes sous contrôle" action={<LinkAction to="/app/appels-offres" />}>
          <div className="deadline-list auditor-procedure-list">
            {tenders.slice(0, 4).map((tender) => (
              <Link key={tender.id} to={`/app/appels-offres/${tender.id}`}>
                <span className="deadline-date"><b>AO</b><small>{displayReference(tender.id)}</small></span>
                <div><b>{tender.title}</b><small>{tender.authority || 'Autorité contractante'} · Budget {tender.budget}</small></div>
                <Badge tone={tender.status === 'Publié' ? 'green' : tender.status === 'Attribué' ? 'ice' : 'neutral'}>
                  {tender.status}
                </Badge>
              </Link>
            ))}
            {tenders.length === 0 && <p className="empty-copy">Aucune procédure enregistrée.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Garanties de contrôle" subtitle="Les règles appliquées aux dossiers">
          <div className="auditor-control-list">
            <article><b>Offres protégées</b><p>Le contenu reste confidentiel jusqu’à l’ouverture officielle.</p></article>
            <article><b>Signaux de risque</b><p>Les anomalies détectées sont à vérifier par les personnes habilitées.</p></article>
            <article><b>Historique conservé</b><p>Les actions et décisions sont consignées dans le journal d’audit.</p></article>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { role, user } = useApp()
  const [summary, setSummary] = useState(null)
  const [tenders, setTenders] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const copy = copyByRole[role] || copyByRole.supplier
  const date = new Intl.DateTimeFormat('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const tenderItems = await tenderService.list()
        if (!active) return
        setTenders(tenderItems.map(toTenderView))
        if (['admin', 'auditor'].includes(role)) {
          const [dashboard, offerResults] = await Promise.all([
            dashboardService.getSummary(),
            Promise.allSettled(tenderItems.map((tender) => offerService.byTender(tender.id))),
          ])
          setSummary(dashboard)
          setOffers(offerResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
        } else if (role === 'authority') {
          const [dashboard, results] = await Promise.all([
            dashboardService.getSummary(),
            Promise.allSettled(tenderItems.map((tender) => offerService.byTender(tender.id))),
          ])
          setSummary(dashboard)
          setOffers(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
        } else if (role === 'supplier') {
          const myOffers = await offerService.mine()
          setSummary(null)
          setOffers(myOffers)
        } else if (role === 'commission') {
          const results = await Promise.allSettled(tenderItems.map((tender) => offerService.byTender(tender.id)))
          setOffers(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [role])

  let stats = []
  if (summary) {
    stats = [
      [Megaphone, "Appels d’offres", summary.nombreAppelsOffres, `${summary.appelsOffresPublies} publiés`, 'navy'],
      [FileStack, 'Offres reçues', summary.nombreOffresRecues, `Participation moyenne : ${summary.tauxParticipationMoyen}`, 'blue'],
      [UsersRound, 'Fournisseurs inscrits', summary.nombreFournisseursInscrits, 'Comptes fournisseur', 'green'],
      [WalletCards, 'Montant publié', formatMoney(summary.montantTotalEstimeAppelsPublies), `${summary.appelsOffresBrouillon} brouillons · ${summary.appelsOffresArchives} archivés`, 'orange'],
    ]
  } else if (role === 'supplier') {
    stats = [
      [Megaphone, 'Opportunités publiées', tenders.length, 'Appels visibles pour ce compte', 'navy'],
      [Send, 'Mes soumissions', offers.length, 'Offres déposées', 'blue'],
      [FileStack, 'Documents déposés', offers.reduce((total, offer) => total + (offer.documents?.length || 0), 0), 'Documents liés à mes offres', 'green'],
      [Archive, 'Offres acceptées', offers.filter((offer) => offer.statut === 'ACCEPTEE').length, 'Statut retourné par l’API', 'orange'],
    ]
  } else {
    stats = [
      [Megaphone, "Appels d’offres", tenders.length, 'Procédures accessibles', 'navy'],
      [FileStack, 'Offres accessibles', offers.length, 'Soumissions reçues', 'blue'],
    ]
  }

  if (role === 'admin') {
    if (loading) return <div className="loading-state"><span className="spinner" /> Chargement du tableau de bord…</div>
    if (error) return <EmptyState icon={FileStack} title="Tableau de bord indisponible" description={error} />
    return <AdminDashboard summary={summary} user={user} tenders={tenders} offers={offers} />
  }
  if (role === 'authority') {
    if (loading) return <div className="loading-state"><span className="spinner" /> Chargement de l’espace autorité…</div>
    if (error) return <EmptyState icon={FileStack} title="Espace autorité indisponible" description={error} />
    return <AuthorityDashboard summary={summary} user={user} tenders={tenders} offers={offers} />
  }
  if (role === 'supplier') {
    if (loading) return <div className="loading-state"><span className="spinner" /> Chargement du tableau de bord…</div>
    if (error) return <EmptyState icon={FileStack} title="Tableau de bord indisponible" description={error} />
    return <SupplierDashboard summary={summary} user={user} tenders={tenders} offers={offers} />
  }
  if (role === 'commission') {
    if (loading) return <div className="loading-state"><span className="spinner" /> Chargement des dossiers de la commission…</div>
    if (error) return <EmptyState icon={FileStack} title="Espace commission indisponible" description={error} />
    return <CommissionDashboard tenders={tenders} offers={offers} user={user} />
  }
  if (role === 'auditor') {
    if (loading) return <div className="loading-state"><span className="spinner" /> Chargement du tableau de bord d’audit…</div>
    if (error) return <EmptyState icon={FileStack} title="Espace d’audit indisponible" description={error} />
    return <AuditorDashboard summary={summary} user={user} tenders={tenders} offers={offers} />
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome"><div><span className="eyebrow">{date.toUpperCase()}</span><h1>{copy.title}</h1><p>{copy.description}</p></div><div className="dashboard-welcome__actions">{role === 'authority' && <Link className="btn btn--primary" to="/app/appels-offres/nouveau">+ Nouvel appel d’offres</Link>}{role === 'supplier' && <Link className="btn btn--primary" to="/app/appels-offres">Voir les opportunités</Link>}</div></header>
      {loading ? <div className="loading-state"><span className="spinner" /> Chargement du tableau de bord…</div> : error ? <EmptyState icon={FileStack} title="Tableau de bord indisponible" description={error} /> : <>
        <DashboardMetricCards items={stats} />
        <SectionCard title="Appels d’offres récents" subtitle="Données les plus récentes retournées par l’API" action={<LinkAction to="/app/appels-offres" />}>
          <div className="deadline-list">{tenders.slice(0, 5).map((tender) => <Link key={tender.id} to={`/app/appels-offres/${tender.id}`}><span className="deadline-date"><b>AO</b><small>{displayReference(tender.id)}</small></span><div><b>{tender.title}</b><small>{tender.authority} · {tender.deadline}</small></div><Badge tone={tender.status === 'Publié' ? 'green' : tender.status === 'Brouillon' ? 'orange' : 'neutral'}>{tender.status}</Badge></Link>)}</div>
        </SectionCard>
      </>}
    </div>
  )
}
