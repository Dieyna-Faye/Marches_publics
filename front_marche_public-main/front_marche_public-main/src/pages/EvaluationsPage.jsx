import { AlertTriangle, Building2, CheckCircle2, Download, LockKeyhole, LockOpen, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { offerService } from '../services/offerService'
import { tenderService } from '../services/tenderService'
import { formatMoney } from '../utils/formatters'

export default function EvaluationsPage() {
  const { id } = useParams()
  const { showToast } = useApp()
  const [tender, setTender] = useState(null)
  const [offers, setOffers] = useState([])
  const [criteria, setCriteria] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [evaluations, setEvaluations] = useState([])
  const [notes, setNotes] = useState({})
  const [savingEvaluation, setSavingEvaluation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [openingBids, setOpeningBids] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const tenderItems = await tenderService.list()
      if (!tenderItems.length) {
        setTender(null)
        setOffers([])
        setCriteria([])
        return
      }
      const offerResults = await Promise.allSettled(tenderItems.map((item) => offerService.byTender(item.id)))
      const offersByTender = new Map(
        tenderItems.map((item, index) => [
          String(item.id),
          offerResults[index].status === 'fulfilled' ? offerResults[index].value : [],
        ])
      )
      const current = id
        ? tenderItems.find((item) => String(item.id) === String(id))
        : tenderItems.find((item) => (offersByTender.get(String(item.id)) || []).length > 0) || tenderItems[0]

      if (!current) throw new Error('L’appel d’offres demandé est introuvable ou inaccessible.')
      const [criteriaItems] = await Promise.all([tenderService.criteria(current.id)])
      const offerItems = offersByTender.get(String(current.id)) || []
      setTender(current)
      setOffers(offerItems)
      setCriteria(criteriaItems)
      setSelectedId((prev) => (offerItems.some((o) => o.id === prev) ? prev : offerItems[0]?.id || ''))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    loadData()
    return () => {
      active = false
    }
  }, [loadData])

  const selected = useMemo(() => offers.find((item) => String(item.id) === String(selectedId)), [offers, selectedId])

  useEffect(() => {
    if (!selected) return
    let active = true
    offerService
      .evaluations(selected.id)
      .then((items) => {
        if (!active) return
        setEvaluations(items)
        setNotes(Object.fromEntries(items.map((item) => [item.criteriaId, { score: item.score, comment: item.comment || '' }])))
      })
      .catch(() => {
        if (active) {
          setEvaluations([])
          setNotes({})
        }
      })
    return () => {
      active = false
    }
  }, [selected?.id])

  const isSealed = Boolean(
    tender &&
      (['PUBLIE', 'CLOTURE', 'BROUILLON', 'EN_VALIDATION'].includes(tender.statut) ||
        offers.some((o) => o.isSealed || o.statut === 'SCELLEE'))
  )

  const handleOpenBids = async () => {
    if (!tender) return
    setOpeningBids(true)
    setError('')
    try {
      await tenderService.openBids(tender.id, true)
      showToast('Séance d’ouverture des plis tenue avec succès ! Le PV officiel est généré et les offres sont déverrouillées.')
      await loadData()
    } catch (requestError) {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally {
      setOpeningBids(false)
    }
  }

  const documents = selected?.documents || []
  const budget = Number(tender?.budgetEstimatif || 0)
  const amount = Number(selected?.montantPropose || 0)
  const gap = budget > 0 && amount > 0 ? Math.round(Math.abs(1 - amount / budget) * 100) : null

  const analyze = async () => {
    if (!selected) return
    if (isSealed) {
      setError('Les plis doivent être formellement ouverts en séance avant de pouvoir lancer l’analyse.')
      showToast('Ouvrez formellement les plis avant l’analyse.', 'error')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const result = await offerService.analyze(selected.id)
      setOffers((current) =>
        current.map((offer) =>
          offer.id === selected.id
            ? {
                ...offer,
                score: { ...result.scores, global: result.scores.globalScore },
                isCompliant: result.compliance.isCompliant,
                complianceSummary: result.compliance.complianceSummary,
                complianceDetails: JSON.stringify(result.compliance.checklist),
                automaticSummary: result.summary,
              }
            : offer
        )
      )
      showToast('Analyse et scoring enregistrés avec succès.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const saveCriterion = async (criterion) => {
    const entry = notes[criterion.id]
    if (entry?.score === '' || entry?.score == null) {
      setError('Saisissez une note avant de l’enregistrer.')
      return
    }
    setSavingEvaluation(criterion.id)
    setError('')
    try {
      const item = await offerService.setEvaluation(selected.id, criterion.id, entry.score, entry.comment)
      setEvaluations((current) => [...current.filter((row) => row.criteriaId !== criterion.id), item])
      showToast('Note technique enregistrée')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingEvaluation('')
    }
  }

  const score = selected?.score
  const downloadDocument = async (document) => {
    try {
      const blob = await offerService.downloadDocument(selected.id, document.id)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = document.nomOriginal
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      showToast(requestError.message, 'error')
    }
  }

  if (loading)
    return (
      <div className="loading-state">
        <span className="spinner" /> Chargement de l’analyse…
      </div>
    )
  if (!tender)
    return <p className="authority-inline-error">{error || 'Aucun appel d’offres disponible pour l’analyse.'}</p>

  return (
    <div className="authority-analysis">
      <div className="authority-breadcrumb">
        <span>APPELS D’OFFRES</span>
        <b>/</b>
        <strong>AO-{tender.id}</strong>
      </div>
      <header className="authority-page-head">
        <div>
          <h1>Analyse approfondie : {tender.titre}</h1>
          <p>Examen des pièces, comparaison indicative, grille technique et préparation de la décision de la commission.</p>
        </div>
        <div className="authority-page-head__actions">
          {isSealed && offers.length > 0 && (
            <button
              className="authority-btn authority-btn--dark"
              style={{ background: '#0284c7', borderColor: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              disabled={openingBids}
              onClick={handleOpenBids}
              type="button"
            >
              <LockOpen size={15} />
              {openingBids ? 'Ouverture des plis…' : '🏛️ Tenir la séance d’ouverture des plis'}
            </button>
          )}
          {selected && !isSealed && (
            <Link className="authority-btn authority-btn--ghost" to={`/app/soumissions/${selected.id}`}>
              Ouvrir le dossier complet
            </Link>
          )}
          <button className="authority-btn authority-btn--ghost" onClick={() => window.print()} type="button">
            <Download size={14} /> Exporter PDF
          </button>
          {!isSealed && (
            <button className="authority-btn authority-btn--dark" disabled={!selected || analyzing} onClick={analyze} type="button">
              <RotateCcw size={14} />
              {analyzing ? 'Analyse…' : 'Analyser et enregistrer'}
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="authority-inline-error" role="alert">
          {error}
        </p>
      )}

      {/* Bannière Scellement Cryptographique & Tenue de la séance d'ouverture des plis */}
      {isSealed && offers.length > 0 && (
        <section
          style={{
            margin: '16px 0 24px',
            padding: '24px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #7dd3fc',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                background: '#0284c7',
                color: '#fff',
                borderRadius: '50%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LockKeyhole size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0369a1' }}>
                  🔒 Coffre-fort numérique : Plis scellés ({offers.length} offre(s) reçue(s))
                </h3>
                <span
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Statut : {tender.statut}
                </span>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.6, color: '#0f172a' }}>
                Conformément aux règles des marchés publics (principe de stricte confidentialité et non-divulgation avant la date limite),
                les offres des soumissionnaires sont <strong>scellées et protégées sous empreinte cryptographique SHA-256</strong>.
                Pour débuter l’instruction, la <strong>Commission d’Évaluation</strong> doit formaliser la séance d’ouverture des plis,
                ce qui déverrouillera les offres, affichera les montants et documents réels, et génèrera le Procès-Verbal officiel d'ouverture (PV).
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  className="authority-btn authority-btn--dark"
                  style={{
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    color: '#fff',
                    padding: '10px 22px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  disabled={openingBids}
                  onClick={handleOpenBids}
                  type="button"
                >
                  <Sparkles size={16} />
                  {openingBids ? 'Ouverture et génération du PV officiel…' : '🏛️ Tenir la séance d’ouverture des plis'}
                </button>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  Horodatage garanti · Procès-verbal d’ouverture traçable dans l’audit
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Aucune soumission déposée */}
      {offers.length === 0 ? (
        <div
          style={{
            margin: '24px 0',
            padding: '36px 20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <Building2 size={40} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 800, color: 'var(--navy)' }}>
            Aucune soumission déposée pour le moment
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '540px', margin: '0 auto 18px', lineHeight: 1.6 }}>
            Cet appel d’offres est actuellement au statut <strong>{tender.statut}</strong>.
            Les offres déposées et scellées par les candidats apparaîtront ici dès leur dépôt officiel.
          </p>
          <Link className="authority-btn authority-btn--ghost" to="/app/appels-offres">
            Consulter les autres appels d’offres
          </Link>
        </div>
      ) : (
        <div className="authority-analysis-grid">
          <main>
            <label className="authority-inline-status">
              Soumission évaluée{' '}
              <select value={selected?.id} onChange={(event) => setSelectedId(event.target.value)}>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.reference} · {offer.fournisseur?.nom || (offer.isSealed ? 'Pli scellé' : 'Fournisseur')}
                  </option>
                ))}
              </select>
            </label>

            <section className="authority-strategy">
              <h2>
                <Sparkles size={15} /> RÉSULTAT ENREGISTRÉ <span>ÉCART BUDGÉTAIRE : {gap == null ? '—' : `${gap}%`}</span>
              </h2>
              <p>
                {isSealed
                  ? 'Offre protégée dans le coffre-fort numérique. Les informations seront déverrouillées lors de la séance d’ouverture des plis.'
                  : `La soumission de ${selected.fournisseur?.nom || 'ce fournisseur'} est évaluée depuis les informations enregistrées.`}
              </p>
              <div>
                <span>
                  <small>OFFRE ANALYSÉE</small>
                  <b>
                    {isSealed ? 'Montant scellé' : formatMoney(selected.montantPropose)} ·{' '}
                    {isSealed ? '—' : `${selected.delaiExecutionJours ?? '—'} jours`}
                  </b>
                  <em>{selected.statut?.replaceAll('_', ' ')}</em>
                </span>
                <span>
                  <small>RECOMMANDATION</small>
                  <b>
                    {isSealed
                      ? 'Séance d’ouverture des plis requise avant analyse'
                      : score?.recommendation || 'Aucune analyse enregistrée; lancez l’analyse.'}
                  </b>
                </span>
              </div>
            </section>

            <section className="authority-verification">
              <header>
                <h2>Notation technique de la commission</h2>
                <p>
                  Les notes sont normalisées par rapport au maximum de chaque critère et pondérées selon la grille de cet appel d’offres.
                </p>
              </header>
              {isSealed ? (
                <p className="empty-copy">
                  🔒 La notation technique sera accessible dès que les plis auront été formellement ouverts en séance.
                </p>
              ) : criteria.filter((item) => !['administratif', 'financier'].includes(String(item.category || '').toLowerCase())).length === 0 ? (
                <p className="empty-copy">
                  Aucun critère technique n’est configuré pour cet appel d’offres. Les notes techniques resteront absentes.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>CRITÈRE</th>
                      <th>POIDS</th>
                      <th>NOTE / MAXIMUM</th>
                      <th>COMMENTAIRE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria
                      .filter((item) => !['administratif', 'financier'].includes(String(item.category || '').toLowerCase()))
                      .map((criterion) => (
                        <tr key={criterion.id}>
                          <td>
                            <b>{criterion.label}</b>
                            <small>{criterion.description}</small>
                          </td>
                          <td>{criterion.weight}%</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={criterion.maxScore}
                              value={notes[criterion.id]?.score ?? ''}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [criterion.id]: { ...current[criterion.id], score: event.target.value },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={notes[criterion.id]?.comment ?? ''}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [criterion.id]: { ...current[criterion.id], comment: event.target.value },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <button
                              className="authority-btn authority-btn--ghost"
                              disabled={savingEvaluation === criterion.id}
                              onClick={() => saveCriterion(criterion)}
                              type="button"
                            >
                              {savingEvaluation === criterion.id ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
              {evaluations.length > 0 && <footer>{evaluations.length} note(s) enregistrée(s). Relancez ensuite l’analyse pour actualiser le score global.</footer>}
            </section>

            <section className="authority-verification">
              <header>
                <h2>État réel de l’examen des pièces</h2>
              </header>
              {isSealed ? (
                <p className="empty-copy">
                  🔒 Les pièces justificatives sont protégées sous scellé cryptographique. Ouvrez les plis pour les examiner et les télécharger.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>DOCUMENT</th>
                      <th>FICHIER</th>
                      <th>STATUT DE REVUE</th>
                      <th>OBSERVATION ENREGISTRÉE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <b>{document.type?.replaceAll('_', ' ')}</b>
                          <small>Document #{document.id}</small>
                        </td>
                        <td>{document.nomOriginal}</td>
                        <td>
                          <em>{document.reviewStatus?.replaceAll('_', ' ') || 'à vérifier'}</em>
                        </td>
                        <td>
                          {document.reviewComment || 'Aucune revue motivée enregistrée.'}
                          {document.reviewedAt && (
                            <small>
                              {' '}
                              · {new Intl.DateTimeFormat('fr-SN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(document.reviewedAt))}
                            </small>
                          )}
                        </td>
                        <td>
                          <button onClick={() => downloadDocument(document)} title="Télécharger" type="button">
                            <Download size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!isSealed && documents.length === 0 && <p className="empty-copy">Aucune pièce déposée.</p>}
              <footer>
                La détection de présence ne certifie ni validité, ni signature, ni authenticité. Ouvrez le dossier complet pour enregistrer une revue motivée et prendre une décision.
              </footer>
            </section>
          </main>

          <aside className="authority-analysis-aside">
            <section className="authority-success-score">
              <span>SCORE GLOBAL ENREGISTRÉ</span>
              <strong>{isSealed ? '—' : score?.global == null ? '—' : `${score.global}/100`}</strong>
              <em>{isSealed ? 'Plis scellés' : score?.riskLevel || 'À analyser'}</em>
              <i>
                <b style={{ width: `${isSealed ? 0 : score?.global || 0}%` }} />
              </i>
              <small>Les critères non renseignés ne sont pas remplacés par une note nulle.</small>
            </section>

            <section className="authority-analysis-alerts">
              <h2>POINTS À EXAMINER</h2>
              <article>
                <span>
                  <ShieldAlert size={14} />
                </span>
                <p>
                  <b>Budget</b>
                  <small>
                    {isSealed ? 'Montant scellé' : `Écart observé : ${gap == null ? 'non calculable' : `${gap}%`} (indicateur comparatif)`}
                  </small>
                </p>
              </article>
              <article>
                <span>
                  <AlertTriangle size={14} />
                </span>
                <p>
                  <b>Documents associés</b>
                  <small>
                    {isSealed ? 'Pièces scellées' : `${documents.length} fichier(s); vérification humaine nécessaire`}
                  </small>
                </p>
              </article>
              <h3>CONFORMITÉ</h3>
              <p>{isSealed ? 'Offre sous pli scellé' : selected.complianceSummary || 'Aucune analyse de conformité enregistrée.'}</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
