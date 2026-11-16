import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  LockKeyhole,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { offerService } from '../services/offerService'
import { tenderService } from '../services/tenderService'
import { formatMoney, toTenderView } from '../utils/formatters'

const documentTypes = [
  ['OFFRE_TECHNIQUE', 'Offre technique & Mémoire méthodologique'],
  ['OFFRE_FINANCIERE', 'Offre financière détaillée (BPU / DQE)'],
  ['QUITUS_FISCAL', 'Quitus fiscal valide'],
  ['ATTESTATION_SOCIALE', 'Attestation sociale (IPRES / CSS)'],
  ['REGISTRE_COMMERCE', 'Registre de commerce (RCCM)'],
  ['PLANNING_EXECUTION', 'Planning d’exécution prévisionnel'],
  ['REFERENCES_TECHNIQUES', 'Références et attestations de bonne fin'],
  ['AUTRE', 'Autre pièce justificative'],
]

const steps = [
  { id: 1, label: 'Création du projet', subtitle: 'Sélection du marché' },
  { id: 2, label: 'Documents', subtitle: 'Pièces administratives & techniques' },
  { id: 3, label: 'Évaluation financière', subtitle: 'Montant & Délais d’exécution' },
  { id: 4, label: 'Détails finaux', subtitle: 'Récapitulatif & Scellement' },
]

export default function SubmissionFormPage() {
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [tenders, setTenders] = useState([])
  const [tenderId, setTenderId] = useState(searchParams.get('appel') || '')
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('')
  const [technicalProposal, setTechnicalProposal] = useState('')
  const [documents, setDocuments] = useState({})
  const [selectedCategory, setSelectedCategory] = useState('OFFRE_TECHNIQUE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast, user } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    tenderService.list({ statut: 'PUBLIE' })
      .then((items) => setTenders(items.map(toTenderView)))
      .catch((requestError) => setError(requestError.message))
  }, [])

  // Si un appel d'offres est passé dans l'URL et valide
  useEffect(() => {
    const appelFromUrl = searchParams.get('appel')
    if (appelFromUrl) {
      setTenderId(appelFromUrl)
      // Charger directement cet appel d'offres spécifique pour pré-remplir les données instantanément
      tenderService.get(appelFromUrl)
        .then((item) => {
          if (item) {
            const viewed = toTenderView(item)
            setTenders((current) => {
              if (current.some((t) => String(t.id) === String(viewed.id))) return current
              return [viewed, ...current]
            })
          }
        })
        .catch(() => {})
    }
  }, [searchParams])

  const selectedTender = useMemo(() => tenders.find((item) => item.id === String(tenderId)), [tenderId, tenders])
  const uploadedEntries = Object.entries(documents).filter(([, file]) => file)

  const addFiles = (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setDocuments((current) => {
      const next = { ...current }
      files.forEach((file, index) => {
        // Détecter un type non encore pourvu ou prendre celui sélectionné
        const type = files.length === 1
          ? selectedCategory
          : documentTypes.find(([candidate]) => !next[candidate])?.[0] || documentTypes[index % documentTypes.length][0]
        next[type] = file
      })
      return next
    })
    showToast(`${files.length} document(s) ajouté(s).`)
  }

  const removeDocument = (type) => {
    setDocuments((current) => {
      const next = { ...current }
      delete next[type]
      return next
    })
  }

  // Navigation entre les étapes avec validation
  const goToNextStep = () => {
    setError('')
    if (currentStep === 1) {
      if (!tenderId) {
        setError('Veuillez sélectionner un appel d’offres pour continuer.')
        showToast('Veuillez sélectionner un appel d’offres.', 'error')
        return
      }
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 2) {
      if (uploadedEntries.length === 0) {
        showToast('Attention : vous n’avez déposé aucun document. Vous pourrez en ajouter plus tard.', 'info')
      }
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 3) {
      const numAmount = Number(amount)
      const numDays = Number(days)
      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        setError('Veuillez renseigner un montant financier proposé valide (supérieur à 0).')
        showToast('Veuillez renseigner un montant financier valide.', 'error')
        return
      }
      if (!days || isNaN(numDays) || numDays <= 0) {
        setError('Veuillez renseigner un délai d’exécution en jours (supérieur à 0).')
        showToast('Veuillez renseigner un délai d’exécution valide.', 'error')
        return
      }
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPreviousStep = () => {
    setError('')
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // Si on avance, vérifier que les prérequis sont valides
    if (targetStep >= 2 && !tenderId) {
      showToast('Veuillez d’abord choisir un appel d’offres.', 'error')
      return
    }
    if (targetStep >= 4 && (!amount || !days)) {
      showToast('Veuillez renseigner le montant et le délai d’exécution à l’étape 3.', 'error')
      setCurrentStep(3)
      return
    }
    setCurrentStep(targetStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Soumission finale officielle (avec scellement cryptographique)
  const submitFinal = async (event) => {
    if (event) event.preventDefault()
    if (!tenderId) {
      setError('Sélectionnez un appel d’offres.')
      showToast('Sélectionnez un appel d’offres.', 'error')
      setCurrentStep(1)
      return
    }
    if (!amount || !days) {
      setError('Veuillez compléter l’évaluation financière (montant et délai).')
      showToast('Montant et délai d’exécution requis.', 'error')
      setCurrentStep(3)
      return
    }

    setLoading(true)
    setError('')
    try {
      const offer = await offerService.submit(tenderId, {
        montantPropose: Number(amount),
        delaiExecutionJours: Number(days),
        technicalProposal: technicalProposal.trim(),
      })

      const entries = Object.entries(documents).filter(([, file]) => file)
      if (entries.length > 0) {
        const results = await Promise.allSettled(
          entries.map(([type, file]) => offerService.uploadDocument(offer.id, type, file))
        )
        const failedCount = results.filter((result) => result.status === 'rejected').length
        if (failedCount) {
          throw new Error(`${failedCount} document(s) n’ont pas pu être ajoutés. Le brouillon est conservé.`)
        }
      }

      const submitted = await offerService.finalize(offer.id)
      showToast(`Offre scellée et déposée avec succès ! Récépissé : ${submitted.accuseReception || 'SHA-256 enregistré'}`)
      navigate('/app/soumissions')
    } catch (requestError) {
      console.error('Erreur soumission offre :', requestError)
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarde en brouillon
  const saveDraft = async () => {
    if (!tenderId) {
      setError('Sélectionnez d’abord un appel d’offres.')
      showToast('Sélectionnez d’abord un appel d’offres.', 'error')
      setCurrentStep(1)
      return
    }
    setLoading(true)
    setError('')
    try {
      const offer = await offerService.saveDraft(tenderId, {
        montantPropose: amount ? Number(amount) : null,
        delaiExecutionJours: days ? Number(days) : null,
        technicalProposal: technicalProposal.trim(),
      })
      const entries = Object.entries(documents).filter(([, file]) => file)
      if (entries.length > 0) {
        await Promise.allSettled(
          entries.map(([type, file]) => offerService.uploadDocument(offer.id, type, file))
        )
      }
      showToast('Votre offre a été enregistrée en brouillon. Vous pourrez la finaliser plus tard.')
      navigate('/app/soumissions')
    } catch (requestError) {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="supplier-submission">
      <header className="authority-page-head">
        <div>
          <h1>Nouveau dépôt d’offre</h1>
          <p>Préparez, déposez et scellez votre offre électronique sous pli protégé pour le marché sélectionné.</p>
        </div>
      </header>

      {/* Stepper Dynamique 4 étapes */}
      <section className="supplier-submission-steps">
        {steps.map(({ id, label }, index) => {
          const isDone = currentStep > id
          const isActive = currentStep === id
          const stepClass = isDone ? 'is-completed' : isActive ? 'is-active' : ''

          return (
            <div
              className={stepClass}
              key={label}
              onClick={() => handleStepClick(id)}
              title={`Cliquer pour aller à l'étape ${id} : ${label}`}
            >
              <span>{isDone ? <Check size={14} /> : id}</span>
              <small>{label}</small>
              {index < steps.length - 1 && <i />}
            </div>
          )
        })}
      </section>

      {/* Bannière d'alerte rouge en cas d'erreur */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#fee2e2',
          border: '1px solid #f87171',
          color: '#991b1b',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="supplier-submission-layout">
        <main>
          {/* ===================== ÉTAPE 1 : CRÉATION DU PROJET & CHOIX DU MARCHÉ ===================== */}
          {currentStep === 1 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #dbe5e9', borderRadius: '8px', padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="#0284c7" />
                  Étape 1 : Sélection du Marché Public & Identification
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                  Sélectionnez l’appel d’offres auquel votre entreprise souhaite candidater.
                </p>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--navy)' }}>
                  Appel d’offres ouvert aux soumissions :
                  <select
                    value={tenderId}
                    onChange={(event) => {
                      setTenderId(event.target.value)
                      setError('')
                    }}
                    style={{
                      height: '46px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: '#fff',
                    }}
                  >
                    <option value="">-- Choisissez un marché public ouvert --</option>
                    {tenders.map((tender) => (
                      <option value={tender.id} key={tender.id}>
                        AO-{tender.id} — {tender.title} ({tender.budget})
                      </option>
                    ))}
                  </select>
                </label>

                {selectedTender && (
                  <div style={{ marginTop: '24px', padding: '18px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--navy)', marginBottom: '12px' }}>
                      📋 Synthèse du Marché : {selectedTender.title}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Référence officielle</span>
                        <b style={{ color: 'var(--navy)', fontSize: '13px' }}>AO-{selectedTender.id}</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Autorité Contractante</span>
                        <b style={{ color: 'var(--navy)', fontSize: '13px' }}>{selectedTender.authority || 'Non spécifiée'}</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Budget Estimatif Acheteur</span>
                        <b style={{ color: '#0369a1', fontSize: '13px' }}>{selectedTender.budget}</b>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block' }}>Date limite de dépôt</span>
                        <b style={{ color: '#b91c1c', fontSize: '13px' }}>{selectedTender.deadline}</b>
                      </div>
                    </div>
                    {selectedTender.description && (
                      <p style={{ marginTop: '14px', fontSize: '12px', color: '#475569', lineHeight: 1.5, background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {selectedTender.description}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} color="#16a34a" />
                  <div style={{ fontSize: '13px' }}>
                    <b style={{ color: '#166534', display: 'block' }}>Candidat connecté : {user?.name || 'Fournisseur Agréé'}</b>
                    <span style={{ color: '#15803d' }}>
                      Votre compte entreprise est certifié et habilité à déposer une offre sous pli électronique scellé.
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={loading || !tenderId}
                    className="authority-btn authority-btn--ghost"
                    style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer' }}
                  >
                    <Save size={16} /> Enregistrer en brouillon
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!tenderId}
                    className="authority-btn authority-btn--dark"
                    style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer', background: '#0f2744', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '6px', fontWeight: 700 }}
                  >
                    Suivant : Dépôt des documents (2/4) <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ===================== ÉTAPE 2 : DOCUMENTS DU DOSSIER ===================== */}
          {currentStep === 2 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #dbe5e9', borderRadius: '8px', padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="#0284c7" />
                  Étape 2 : Dépôt des Pièces et Justificatifs
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                  Téléchargez les pièces obligatoires de votre offre (mémoire technique, attestations administratives, quitus fiscal).
                </p>

                {/* Sélecteur de type avant upload */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Type de pièce à déposer :</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, background: '#fff' }}
                  >
                    {documentTypes.map(([code, label]) => (
                      <option value={code} key={code}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Zone Drag & Drop */}
                <label className="supplier-upload-zone" style={{ cursor: 'pointer', border: '2px dashed #93c5fd' }}>
                  <span><UploadCloud size={28} /></span>
                  <b>Déposer un fichier pour : {documentTypes.find(([c]) => c === selectedCategory)?.[1]}</b>
                  <p>Glissez et déposez vos fichiers PDF ou ZIP, ou cliquez pour parcourir vos dossiers.</p>
                  <em>Sélectionner le fichier</em>
                  <input
                    type="file"
                    accept="application/pdf,.zip"
                    onChange={(event) => addFiles(event.target.files)}
                  />
                </label>

                {/* Liste des pièces déposées */}
                <section className="supplier-document-list" style={{ marginTop: '24px' }}>
                  <header>
                    <h2>Pièces enregistrées au dossier</h2>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>
                      {uploadedEntries.length} pièce(s) jointe(s)
                    </span>
                  </header>
                  {uploadedEntries.map(([type, file]) => (
                    <article key={type}>
                      <span><FileText size={16} /></span>
                      <p>
                        <b style={{ fontSize: '13px', color: 'var(--navy)' }}>{file.name}</b>
                        <small style={{ fontSize: '11px', color: '#64748b' }}>
                          Type : <strong>{documentTypes.find(([candidate]) => candidate === type)?.[1] || type}</strong> · {(file.size / 1024 / 1024).toFixed(2)} Mo
                        </small>
                      </p>
                      <button
                        onClick={() => removeDocument(type)}
                        type="button"
                        title="Retirer ce document"
                        style={{ cursor: 'pointer' }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </article>
                  ))}
                  {uploadedEntries.length === 0 && (
                    <p className="empty-copy" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Aucun document n’a encore été attaché. Vous pouvez en sélectionner un ci-dessus ou continuer.
                    </p>
                  )}
                </section>

                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="authority-btn authority-btn--ghost"
                    style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Précédent (Projet)
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={loading}
                      className="authority-btn authority-btn--ghost"
                      style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer' }}
                    >
                      <Save size={16} /> Brouillon
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="authority-btn authority-btn--dark"
                      style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer', background: '#0f2744', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '6px', fontWeight: 700 }}
                    >
                      Suivant : Évaluation financière (3/4) <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===================== ÉTAPE 3 : ÉVALUATION FINANCIÈRE ===================== */}
          {currentStep === 3 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #dbe5e9', borderRadius: '8px', padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <WalletCards size={20} color="#0284c7" />
                  Étape 3 : Évaluation Financière & Délais d’Exécution
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                  Renseignez le montant global forfaitaire de votre proposition ainsi que le délai d’exécution envisagé en jours calendaires.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--navy)' }}>
                    <span>Montant total proposé (FCFA TTC) *</span>
                    <input
                      type="number"
                      min="1"
                      step="1000"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        setError('')
                      }}
                      placeholder="Ex. 45000000"
                      required
                      style={{
                        height: '46px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--navy)',
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                      Montant en chiffres : {amount ? formatMoney(Number(amount)) : '0 FCFA'}
                    </small>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--navy)' }}>
                    <span>Délai d’exécution proposé (en jours) *</span>
                    <input
                      type="number"
                      min="1"
                      value={days}
                      onChange={(e) => {
                        setDays(e.target.value)
                        setError('')
                      }}
                      placeholder="Ex. 90"
                      required
                      style={{
                        height: '46px',
                        padding: '0 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--navy)',
                      }}
                    />
                    <small style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
                      Durée d’exécution de la commande après notification d’attribution.
                    </small>
                  </label>
                </div>

                {/* Synthèse comparative indicative */}
                {selectedTender && (
                  <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Budget prévisionnel de l’acheteur :</span>
                      <b style={{ display: 'block', fontSize: '15px', color: 'var(--navy)' }}>{selectedTender.budget}</b>
                    </div>
                    {amount && Number(selectedTender.budgetEstimatif) > 0 && (
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Positionnement de votre offre :</span>
                        <b style={{ display: 'block', fontSize: '15px', color: Number(amount) <= Number(selectedTender.budgetEstimatif) ? '#16a34a' : '#d97706' }}>
                          {((Number(amount) / Number(selectedTender.budgetEstimatif)) * 100).toFixed(1)}% du budget estimatif
                        </b>
                      </div>
                    )}
                  </div>
                )}

                {/* Note technique optionnelle */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 700, fontSize: '13px', color: 'var(--navy)' }}>
                    <span>Note de synthèse méthodologique / Commentaires (optionnel) :</span>
                    <textarea
                      rows={4}
                      value={technicalProposal}
                      onChange={(e) => setTechnicalProposal(e.target.value)}
                      placeholder="Résumez brièvement les points forts de votre offre technique et méthodologie..."
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                </div>

                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="authority-btn authority-btn--ghost"
                    style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Précédent (Documents)
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={loading}
                      className="authority-btn authority-btn--ghost"
                      style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer' }}
                    >
                      <Save size={16} /> Brouillon
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!amount || !days}
                      className="authority-btn authority-btn--dark"
                      style={{ minHeight: '44px', padding: '0 24px', cursor: 'pointer', background: '#0f2744', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '6px', fontWeight: 700 }}
                    >
                      Suivant : Détails finaux (4/4) <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===================== ÉTAPE 4 : DÉTAILS FINAUX & SCELLEMENT DU PLI ===================== */}
          {currentStep === 4 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', border: '1px solid #dbe5e9', borderRadius: '8px', padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#16a34a" />
                  Étape 4 : Récapitulatif Final & Scellement Cryptographique
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                  Vérifiez l’exactitude des informations avant le scellement définitif sous pli électronique inaltérable.
                </p>

                {/* Tableau récapitulatif */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)', marginBottom: '14px' }}>
                    Bilan de la Soumission
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Marché Public</span>
                      <b style={{ color: 'var(--navy)' }}>AO-{selectedTender?.id}</b>
                      <small style={{ display: 'block', color: '#475569' }}>{selectedTender?.title}</small>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Montant Financier Proposé</span>
                      <b style={{ color: '#0369a1', fontSize: '16px' }}>{formatMoney(Number(amount))}</b>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Délai d’exécution proposé</span>
                      <b style={{ color: 'var(--navy)', fontSize: '16px' }}>{days} jours</b>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Documents joints</span>
                      <b style={{ color: '#16a34a', fontSize: '16px' }}>{uploadedEntries.length} pièce(s)</b>
                    </div>
                  </div>
                </div>

                {/* Pièces jointes récap */}
                {uploadedEntries.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '10px' }}>
                      Justificatifs joints au pli :
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {uploadedEntries.map(([type, file]) => (
                        <li key={type}>
                          <strong>{documentTypes.find(([c]) => c === type)?.[1] || type}</strong> : {file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Encadré Scellement Cryptographique et Confidentialité (Zero-Knowledge) */}
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  marginBottom: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <LockKeyhole size={28} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '13px', color: '#1e3a8a' }}>
                      <b style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: '#1e40af' }}>
                        🔒 Protection par Scellement Cryptographique (Zero-Knowledge)
                      </b>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>
                        Conformément à la réglementation des marchés publics, votre pli sera <strong>strictement scellé et horodaté</strong>.
                        Le montant financier et les offres techniques sont inaccessibles à l’autorité contractante et aux membres de la commission
                        jusqu’à la <strong>séance officielle d’ouverture des plis</strong>.
                        Un récépissé d’accusé de réception électronique avec <strong>empreinte SHA-256 infalsifiable</strong> vous sera délivré.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action Étape 4 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="authority-btn authority-btn--ghost"
                    style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Précédent (Évaluation financière)
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={loading}
                      className="authority-btn authority-btn--ghost"
                      style={{ minHeight: '44px', padding: '0 18px', cursor: 'pointer' }}
                    >
                      <Save size={16} /> Enregistrer brouillon
                    </button>
                    <button
                      type="button"
                      onClick={submitFinal}
                      disabled={loading}
                      className="authority-btn authority-btn--dark"
                      style={{
                        minHeight: '44px',
                        padding: '0 26px',
                        cursor: 'pointer',
                        background: '#047857',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '14px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                      }}
                    >
                      {loading ? <span className="spinner" /> : <>🔒 Sceller & Déposer l’Offre Définitive <Send size={16} /></>}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* ===================== PANNEAU LATÉRAL (RÉSUMÉ & STATUT DU DÉPÔT) ===================== */}
        <aside>
          <section className="supplier-deposit-summary">
            <h2>Résumé du dépôt</h2>

            <dl>
              <div>
                <dt>Étape courante</dt>
                <dd style={{ color: '#0284c7', fontWeight: 800 }}>Étape {currentStep} sur 4</dd>
              </div>
              <div>
                <dt>Réf. de l’offre</dt>
                <dd>{selectedTender ? `OFFRE-${selectedTender.id}` : '—'}</dd>
              </div>
              <div>
                <dt>Entreprise</dt>
                <dd>{user?.name || 'Fournisseur connecté'}</dd>
              </div>
              <div>
                <dt>Type de marché</dt>
                <dd>{selectedTender?.type || '—'}</dd>
              </div>
              <div>
                <dt>Échéance</dt>
                <dd>{selectedTender?.deadline || '—'}</dd>
              </div>
              {amount && (
                <div>
                  <dt>Montant proposé</dt>
                  <dd style={{ color: '#0369a1', fontWeight: 800 }}>{formatMoney(Number(amount))}</dd>
                </div>
              )}
              {days && (
                <div>
                  <dt>Délai proposé</dt>
                  <dd>{days} jours</dd>
                </div>
              )}
            </dl>

            <div className="supplier-validation" style={{ marginTop: '16px' }}>
              <b>ÉTAT DE VALIDATION DU DOSSIER</b>
              <span className={tenderId ? 'done' : ''}>
                <i /> 1. Marché public sélectionné
              </span>
              <span className={uploadedEntries.length ? 'done' : ''}>
                <i /> 2. Documents joints ({uploadedEntries.length})
              </span>
              <span className={amount && days ? 'done' : ''}>
                <i /> 3. Proposition financière & délais
              </span>
              <span className={currentStep === 4 && amount && days ? 'done' : ''}>
                <i /> 4. Prêt pour scellement cryptographique
              </span>
              <em>
                {Math.max(0, 3 - [tenderId, amount && days, uploadedEntries.length].filter(Boolean).length)} étape(s) restante(s)
              </em>
            </div>

            {/* Boutons d'action dans la barre latérale selon l'étape */}
            {currentStep < 4 ? (
              <button
                className="supplier-submit-final"
                type="button"
                onClick={goToNextStep}
                disabled={currentStep === 1 && !tenderId}
                style={{ cursor: 'pointer', background: '#0f2744' }}
              >
                Suivant : Étape {currentStep + 1} <ChevronRight size={14} />
              </button>
            ) : (
              <button
                className="supplier-submit-final"
                type="button"
                onClick={submitFinal}
                disabled={loading || !tenderId || !amount || !days}
                style={{ cursor: 'pointer', background: '#047857' }}
              >
                {loading ? <span className="spinner" /> : <>🔒 Dépôt Définitif <ChevronRight size={14} /></>}
              </button>
            )}

            <button
              disabled={loading || !tenderId}
              onClick={saveDraft}
              type="button"
              style={{ cursor: 'pointer', marginTop: '10px' }}
            >
              Enregistrer en brouillon
            </button>
          </section>

          <section className="supplier-help">
            <LockKeyhole size={18} />
            <p>
              <b>Sécurisation et Non-Répudiation</b>
              <small>
                Votre offre est protégée par chiffrement jusqu’à la séance publique d’ouverture des plis.
              </small>
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
