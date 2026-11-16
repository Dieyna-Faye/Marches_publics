import {
  AlertCircle,
  ArrowRight,
  Bot, Check, ChevronRight, CircleCheck, ClipboardCheck, FileSearch, FileText,
  Gavel, MapPin, Save, Send, UploadCloud,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { tenderService } from '../services/tenderService'

function getDefaultDeadline() {
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  nextMonth.setHours(18, 0, 0, 0)
  return nextMonth.toISOString().slice(0, 16)
}

function generateDefaultReference() {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `AO-${year}-${rand}`
}

const initialForm = {
  titre: '',
  description: '',
  budgetEstimatif: '',
  typeMarche: '',
  dateLimiteSoumission: getDefaultDeadline(),
  reference: generateDefaultReference(),
  nombreLots: '01',
  localisation: 'Dakar, Sénégal',
}

const steps = [
  { label: '1. Dépôt des besoins', icon: ClipboardCheck, current: true },
  { label: '2. Analyse documentaire IA', icon: Bot },
  { label: '3. Clôture & Dépôt des plis', icon: Send },
  { label: '4. Séance d’ouverture (PV)', icon: FileSearch },
  { label: '5. Évaluation des offres', icon: FileText },
  { label: '6. Attribution définitive', icon: Gavel },
]

export default function CreateTenderPage() {
  const [form, setForm] = useState(initialForm)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { showToast } = useApp()

  useEffect(() => {
    if (!id) return
    tenderService.get(id).then((tender) => setForm((current) => ({
      ...current,
      titre: tender.titre,
      description: tender.description,
      budgetEstimatif: tender.budgetEstimatif,
      typeMarche: tender.typeMarche,
      dateLimiteSoumission: tender.dateLimiteSoumission ? new Date(tender.dateLimiteSoumission).toISOString().slice(0, 16) : '',
      reference: `AO-${tender.id}`,
    }))).catch((requestError) => {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    })
  }, [id, showToast])

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null
    if (selectedFile) {
      const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        showToast('Le cahier des charges doit être obligatoirement au format PDF.', 'error')
        setError('Le cahier des charges doit être un fichier PDF valide (%PDF-).')
        return
      }
      setError('')
      setFile(selectedFile)
      showToast(`Fichier sélectionné : ${selectedFile.name}`)
    }
  }

  const validateForm = () => {
    if (!form.titre || !form.titre.trim()) {
      setError('Veuillez renseigner le titre de l’appel d’offres.')
      showToast('Veuillez renseigner le titre de l’appel d’offres.', 'error')
      document.querySelector('[name="titre"]')?.focus()
      return false
    }
    if (!form.typeMarche) {
      setError('Veuillez sélectionner le secteur d’activité / catégorie du marché.')
      showToast('Veuillez sélectionner le secteur d’activité.', 'error')
      document.querySelector('[name="typeMarche"]')?.focus()
      return false
    }
    if (!form.description || !form.description.trim()) {
      setError('Veuillez décrire le besoin dans la description du marché.')
      showToast('Veuillez décrire le besoin.', 'error')
      document.querySelector('[name="description"]')?.focus()
      return false
    }
    const budget = Number(form.budgetEstimatif)
    if (!form.budgetEstimatif || isNaN(budget) || budget <= 0) {
      setError('Veuillez spécifier un budget estimatif valide (supérieur à 0).')
      showToast('Veuillez spécifier un budget estimatif supérieur à 0.', 'error')
      document.querySelector('[name="budgetEstimatif"]')?.focus()
      return false
    }
    if (!form.dateLimiteSoumission) {
      setError('Veuillez définir une date limite de soumission (clôture).')
      showToast('Veuillez définir une date limite de soumission.', 'error')
      document.querySelector('[name="dateLimiteSoumission"]')?.focus()
      return false
    }
    const deadlineDate = new Date(form.dateLimiteSoumission)
    if (isNaN(deadlineDate.getTime())) {
      setError('La date limite de soumission est invalide.')
      showToast('La date limite de soumission est invalide.', 'error')
      document.querySelector('[name="dateLimiteSoumission"]')?.focus()
      return false
    }
    return true
  }

  const executeSave = async () => {
    if (!validateForm()) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        budgetEstimatif: Number(form.budgetEstimatif),
        typeMarche: form.typeMarche,
        dateLimiteSoumission: new Date(form.dateLimiteSoumission).toISOString(),
      }
      const tender = isEditing ? await tenderService.update(id, payload) : await tenderService.create(payload)

      if (file && tender?.id) {
        try {
          await tenderService.uploadSpecifications(tender.id, file)
        } catch (uploadError) {
          console.error('Erreur upload cahier des charges :', uploadError)
          showToast(`Marché créé mais échec de dépôt du PDF : ${uploadError.message}`, 'error')
        }
      }

      showToast(isEditing ? 'Le marché a été mis à jour avec succès !' : 'Marché public créé et enregistré avec succès !')
      navigate(`/app/appels-offres/${tender.id}`)
    } catch (requestError) {
      console.error('Erreur enregistrement marché :', requestError)
      const msg = requestError.message || 'Impossible d’enregistrer le marché. Veuillez vérifier les champs.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    if (event) event.preventDefault()
    executeSave()
  }

  return (
    <div className="authority-create">
      <div className="authority-breadcrumb"><span>Marchés</span><ChevronRight size={12} /><b>{isEditing ? 'Modifier' : 'Nouveau'}</b></div>

      <header className="authority-page-head">
        <div>
          <h1>{isEditing ? 'Modifier le Marché Public' : 'Nouveau Marché Public'}</h1>
          <p>Configurez les paramètres de votre appel d’offres. Vous pourrez ensuite publier le DAO, ouvrir les plis scellés et évaluer les offres.</p>
        </div>
        <div className="authority-page-head__actions">
          <button className="authority-btn authority-btn--ghost" disabled={loading} onClick={executeSave} type="button">
            <Save size={14} /> Brouillon
          </button>
          <button className="authority-btn authority-btn--dark" disabled={loading} onClick={executeSave} type="button">
            {loading ? <span className="spinner" /> : <>Enregistrer le marché <ChevronRight size={15} /></>}
          </button>
        </div>
      </header>

      {/* Alerte Erreur bien visible en haut si présente */}
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

      <section className="authority-workflow">
        <h2>Cycle de Vie de la Procédure</h2>
        <div>
          {steps.map(({ label, icon: Icon, current }, index) => (
            <div className={`authority-workflow__step ${current ? 'is-done' : ''}`} key={label}>
              <span>{current ? <Check size={13} /> : <Icon size={13} />}</span>
              <small>{label}</small>
              {index < steps.length - 1 && <i />}
            </div>
          ))}
        </div>
      </section>

      <form className="authority-tender-form" id="authority-tender-form" onSubmit={handleSubmit}>
        <section className="authority-form-card">
          <h2><CircleCheck size={16} /> Détails du Marché</h2>
          <label className="authority-field authority-field--full">Titre de l’appel d’offres
            <input name="titre" value={form.titre} onChange={update} placeholder="Ex. Travaux d'aménagement des infrastructures pédagogiques à Diamniadio" required />
          </label>
          <label className="authority-field">Secteur d’activité
            <select name="typeMarche" value={form.typeMarche} onChange={update} required>
              <option value="">Sélectionner un secteur</option>
              <option value="TRAVAUX">Infrastructures & Travaux</option>
              <option value="FOURNITURES">Fournitures & Équipements</option>
              <option value="SERVICES">Services & Maintenance</option>
              <option value="PRESTATIONS_INTELLECTUELLES">Prestations intellectuelles & Études</option>
            </select>
          </label>
          <label className="authority-field">Référence interne
            <input name="reference" value={form.reference} onChange={update} />
          </label>
          <label className="authority-field authority-field--full">Description du besoin
            <textarea name="description" value={form.description} onChange={update} rows="6" placeholder="Décrivez les objectifs, le contexte technique et les exigences du marché..." required />
          </label>
        </section>

        <section className="authority-upload-card">
          <div className="authority-upload-card__icon"><FileText size={24} /></div>
          <h2>Cahier des Charges (DAO)</h2>
          <p>Déposez votre document PDF pour analyse de conformité et mise à disposition des soumissionnaires.</p>
          <label className="authority-upload-button">
            <UploadCloud size={15} /> {file?.name || 'Parcourir les fichiers (PDF)'}
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </label>
          {file && (
            <p style={{ marginTop: '10px', fontSize: '11px', color: '#047857', fontWeight: 600 }}>
              ✓ {file.name} ({(file.size / 1024).toFixed(0)} Ko)
            </p>
          )}
        </section>

        <section className="authority-critical">
          <header>
            <h2>Paramètres Financiers & Calendrier</h2>
            <button onClick={() => document.querySelector('[name="budgetEstimatif"]')?.focus()} type="button">Modifier</button>
          </header>
          <div>
            <label>Budget estimé (FCFA)
              <input name="budgetEstimatif" type="number" min="1" step="1000" value={form.budgetEstimatif} onChange={update} placeholder="Ex. 50 000 000" required />
            </label>
            <label>Date limite de dépôt (Clôture)
              <input name="dateLimiteSoumission" type="datetime-local" value={form.dateLimiteSoumission} onChange={update} required />
            </label>
            <label>Nombre de lots
              <input name="nombreLots" value={form.nombreLots} onChange={update} placeholder="Ex. 01" />
            </label>
            <label>Localisation
              <span>
                <MapPin size={13} />
                <input name="localisation" value={form.localisation} onChange={update} placeholder="Dakar, Sénégal" />
              </span>
            </label>
          </div>
        </section>

        {/* Barre d'action basse bien visible pour éviter d'avoir à remonter en haut */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '14px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
        }}>
          <button
            type="button"
            className="authority-btn authority-btn--ghost"
            disabled={loading}
            onClick={executeSave}
            style={{ minHeight: '44px', padding: '0 20px', cursor: 'pointer' }}
          >
            <Save size={16} /> Enregistrer en brouillon
          </button>
          <button
            type="submit"
            className="authority-btn authority-btn--dark"
            disabled={loading}
            style={{
              minHeight: '44px',
              padding: '0 24px',
              background: '#0f2744',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {loading ? <span className="spinner" /> : <>Créer & Accéder au marché <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
    </div>
  )
}
