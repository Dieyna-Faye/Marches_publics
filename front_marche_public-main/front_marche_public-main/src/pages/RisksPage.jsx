import { AlertTriangle, Check, CircleAlert, RotateCcw, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { tenderService } from '../services/tenderService'
import { displayReference } from '../utils/formatters'

function parseMetadata(value) {
  try { return typeof value === 'string' ? JSON.parse(value) : value || {} } catch { return {} }
}

function severityRank(value) {
  return ({ critique: 4, critical: 4, eleve: 3, élevé: 3, high: 3, moyen: 2, medium: 2, modere: 2, modéré: 2, faible: 1, low: 1 })[String(value || '').toLowerCase()] || 0
}

function isResolved(alert) {
  return String(alert.status || '').toLowerCase() === 'resolue'
}

function displayDate(value) {
  if (!value) return 'Date non précisée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date non précisée'
  return new Intl.DateTimeFormat('fr-SN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function RisksPage() {
  const [alerts, setAlerts] = useState([])
  const [tenders, setTenders] = useState([])
  const [selectedTender, setSelectedTender] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const [records, tenderItems] = await Promise.all([api.get('/alerts'), tenderService.list()])
    setAlerts(records.filter((item) => item.type !== 'delay_prediction').map((item) => ({ ...item, metadataObject: parseMetadata(item.metadata) })))
    setTenders(tenderItems)
    setSelectedTender((current) => current || tenderItems[0]?.id || '')
  }

  useEffect(() => {
    let active = true
    load().catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const scan = async () => {
    if (!selectedTender) return
    setScanning(true)
    setError('')
    try { await api.post(`/alerts/scan/${selectedTender}`, {}); await load() }
    catch (err) { setError(err.message) }
    finally { setScanning(false) }
  }

  const resolve = async (alert) => {
    setResolvingId(alert.id)
    setError('')
    try { await api.post(`/alerts/${alert.id}/resolve`, { status: 'resolue' }); await load() }
    catch (err) { setError(err.message) }
    finally { setResolvingId(null) }
  }

  const openAlerts = alerts.filter((alert) => !isResolved(alert))
  const criticalAlerts = openAlerts.filter((alert) => severityRank(alert.severity) >= 3)
  const resolvedCount = alerts.length - openAlerts.length
  const orderedAlerts = [...alerts].sort((left, right) => Number(isResolved(left)) - Number(isResolved(right)) || severityRank(right.severity) - severityRank(left.severity))

  return <div className="risk-page">
    <header className="risk-page__header">
      <div className="risk-page__heading">
        <span className="risk-page__eyebrow"><ShieldAlert size={14}/> CENTRE DE SURVEILLANCE</span>
        <h1>Alertes de risque</h1>
        <p>Examinez les signaux détectés et consignez leur vérification. Un signal automatisé ne constitue pas une preuve.</p>
      </div>
      <section className="risk-scan-card" aria-label="Analyser un appel d’offres">
        <label htmlFor="risk-tender-select">Lancer une analyse</label>
        <div>
          <select id="risk-tender-select" value={selectedTender} onChange={(event) => setSelectedTender(event.target.value)}>
            <option value="">Choisir un appel d’offres</option>
            {tenders.map((tender) => <option key={tender.id} value={tender.id}>{displayReference(tender.reference || `AO-${tender.id}`)} · {tender.title}</option>)}
          </select>
          <button className="btn btn--primary" disabled={!selectedTender || scanning} onClick={scan} type="button"><RotateCcw size={15} className={scanning ? 'is-spinning' : ''}/>{scanning ? 'Analyse…' : 'Analyser'}</button>
        </div>
      </section>
    </header>

    {error && <p className="risk-page__error" role="alert"><CircleAlert size={16}/>{error}</p>}
    {loading ? <div className="loading-state"><span className="spinner"/> Chargement des alertes…</div> : (!error || alerts.length > 0) && <>
      <section className="risk-overview-card" aria-label="Synthèse des alertes">
        <div className="risk-overview-card__lead"><span><ShieldAlert size={23}/></span><div><small>ALERTES À EXAMINER</small><strong>{openAlerts.length}</strong><p>signal(aux) en attente de vérification</p></div></div>
        <div className="risk-overview-card__metrics">
          <article><span className="risk-overview-card__dot is-critical"/><div><small>Priorité élevée</small><b>{criticalAlerts.length}</b></div></article>
          <article><span className="risk-overview-card__dot is-neutral"/><div><small>Total détecté</small><b>{alerts.length}</b></div></article>
          <article><span className="risk-overview-card__dot is-resolved"/><div><small>Vérifiées</small><b>{resolvedCount}</b></div></article>
        </div>
        <footer>Les alertes sont classées par priorité. Toute décision de suivi appartient à une personne habilitée.</footer>
      </section>

      <section className="risk-inbox">
        <header className="risk-inbox__header"><div><span className="risk-page__eyebrow">SUIVI</span><h2>Alertes enregistrées</h2><p>Les alertes ouvertes et prioritaires apparaissent en premier.</p></div><span className="risk-inbox__count">{openAlerts.length} à vérifier <i/> {alerts.length} au total</span></header>
        {alerts.length === 0 ? <div className="risk-inbox__empty"><span><ShieldAlert size={23}/></span><b>Aucune alerte pour le moment</b><p>Choisissez un appel d’offres ci-dessus pour lancer une analyse des offres.</p></div> : <div className="risk-alert-list">
          {orderedAlerts.map((alert) => {
            const resolved = isResolved(alert)
            const highPriority = severityRank(alert.severity) >= 3
            const tenderReference = displayReference(alert.tender?.reference || (alert.metadataObject?.tenderId ? `AO-${alert.metadataObject.tenderId}` : alert.entityId || 'Appel d’offres non précisé'))
            return <article className={`risk-alert-item ${resolved ? 'is-resolved' : highPriority ? 'is-high' : 'is-open'}`} key={alert.id}>
              <span className="risk-alert-item__icon">{resolved ? <Check size={18}/> : <AlertTriangle size={18}/>}</span>
              <div className="risk-alert-item__body">
                <div className="risk-alert-item__meta"><b>{alert.type?.replaceAll('_', ' ') || 'Signal de risque'}</b><span>{tenderReference}</span></div>
                <p>{alert.message || 'Le détail du signal est indisponible.'}</p>
                <small>{displayDate(alert.createdAt)}</small>
              </div>
              <div className="risk-alert-item__actions"><span className={`risk-alert-item__severity ${highPriority && !resolved ? 'is-high' : ''}`}>{alert.severity || 'À vérifier'}</span><span className={`risk-alert-item__status ${resolved ? 'is-resolved' : ''}`}>{resolved ? 'Vérifiée' : 'À vérifier'}</span>{!resolved && <button onClick={() => resolve(alert)} disabled={resolvingId === alert.id} type="button">{resolvingId === alert.id ? 'Enregistrement…' : 'Marquer vérifiée'}</button>}</div>
            </article>
          })}
        </div>}
      </section>
    </>}
  </div>
}
