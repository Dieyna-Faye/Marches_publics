import {
  AlertTriangle, ArrowRight, Banknote, BrainCircuit, Check, ChevronDown, ChevronUp,
  CircleCheck, ClipboardCheck, CloudUpload, FileText, LayoutGrid, ListChecks, Network,
  Shield, Signature, Sparkles, TrendingUp, X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PublicTenderCard from '../components/PublicTenderCard'
import tenderImage from '../assets/tender-handshake.png'
import { tenderService } from '../services/tenderService'
import { formatMoney, toTenderView } from '../utils/formatters'

const benefits = [
  [Network, 'Gestion centralisée', "Un tableau de bord unique pour piloter l’ensemble de vos marchés et documents."],
  [CloudUpload, 'Soumission 100% en ligne', 'Processus totalement dématérialisé avec signature électronique sécurisée.'],
  [BrainCircuit, 'Analyse intelligente', 'Des algorithmes qui extraient les points clés des offres automatiquement.'],
  [AlertTriangle, "Détection d’anomalies", 'Identification proactive des incohérences ou risques de fraude.'],
  [ClipboardCheck, 'Suivi des contrats', 'Gestion post-attribution avec alertes sur les échéances et livrables.'],
]

const tools = [
  [FileText, 'Gestion AO', "Créer vos dossiers d’appels d’offres en quelques clics avec des modèles pré-approuvés."],
  [Signature, 'Soumission numérique', "Coffre-fort numérique scellé pour garantir l’intégrité des offres jusqu’à l’ouverture."],
  [ListChecks, 'Évaluation', "Grilles de notation personnalisables pour les commissions d’évaluation."],
  [TrendingUp, 'Scoring fournisseurs', "Historique de performance et santé financière analysée en temps réel."],
  [Shield, 'Détection de fraude', "Contrôle anti-corruption et détection de collusion par analyse comportementale."],
  [LayoutGrid, 'Dashboard', "Reporting analytique complet pour les directions achat et ministères."],
]

export default function LandingPage() {
  const [tenders, setTenders] = useState([])
  const [showLatest, setShowLatest] = useState(false)
  const [scrolledPastHero, setScrolledPastHero] = useState(false)

  useEffect(() => {
    let active = true
    tenderService.publicList()
      .then((items) => { if (active) setTenders(items.map(toTenderView)) })
      .catch(() => { if (active) setTenders([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      // N'apparaît que lorsqu'on commence à scroller et qu'on a dépassé le hero (~360px)
      setScrolledPastHero(window.scrollY > 360)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const budget = tenders.reduce((sum, tender) => sum + Number(tender.estimatedBudget || 0), 0)
  const openTenders = tenders.filter((tender) => {
    const deadline = tender.dateLimiteSoumission || tender.submissionDeadline
    return !deadline || new Date(deadline).getTime() >= Date.now()
  }).length

  return (
    <main>
      <section className="p-home-hero" style={{ '--p-hero-image': `url(${tenderImage})` }}>
        <div className="p-home-hero__backdrop" />
        <div className="p-home-hero__content">
          <div className="p-home-hero__copy">
            <span className="p-home-hero__eyebrow"><Sparkles size={15} /> PROCUREAI · COMMANDE PUBLIQUE</span>
            <h1>Simplifiez et sécurisez la gestion des <em>marchés publics</em> grâce à l’intelligence artificielle</h1>
            <p>Une plateforme intelligente et transparente pour moderniser chaque étape de la commande publique.</p>
            <div className="p-home-hero__actions">
              <Link className="p-button p-button--blue" to="/appels-offres">
                Explorer les appels d’offres <ArrowRight size={16} />
              </Link>
              <Link className="p-button p-button--glass" to="/connexion">Se connecter</Link>
            </div>
          </div>
        </div>
        <div className="p-home-hero__metrics" aria-label="Chiffres des appels d’offres publics">
          <article><span className="p-home-hero__metric-icon"><FileText size={22} /></span><div><strong>{tenders.length}</strong><small>Appels publiés</small></div><ArrowRight size={17} /></article>
          <article><span className="p-home-hero__metric-icon p-home-hero__metric-icon--accent"><CircleCheck size={22} /></span><div><strong>{openTenders}</strong><small>Encore ouverts</small></div><ArrowRight size={17} /></article>
          <article><span className="p-home-hero__metric-icon"><Banknote size={22} /></span><div><strong>{formatMoney(budget)}</strong><small>Budget estimé cumulé</small></div><ArrowRight size={17} /></article>
        </div>
      </section>

      {/* Section dynamique révélée au clic sur le bouton */}
      {showLatest && (
        <section id="derniers-appels" className="p-section p-dynamic-tenders">
          <div className="p-container">
            <header className="p-section-title">
              <span>OPPORTUNITÉS EN DIRECT</span>
              <h2>Derniers appels d’offres publiés</h2>
              <p>Consultez les opportunités les plus récentes ouvertes aux soumissions et déposez vos offres en toute sécurité.</p>
            </header>
            <div className="p-tender-grid">
              {tenders.slice(0, 3).map((tender) => (
                <PublicTenderCard tender={tender} key={tender.id} />
              ))}
              {tenders.length === 0 && (
                <div className="p-empty-tenders">
                  <p>Aucun appel d’offres publié pour le moment.</p>
                </div>
              )}
            </div>
            <div className="p-dynamic-tenders__actions">
              <Link className="p-button p-button--dark" to="/appels-offres">
                Voir tous les appels d’offres ({tenders.length}) <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                className="p-button p-button--outline"
                onClick={() => {
                  setShowLatest(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Masquer <X size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="p-section p-why">
        <div className="p-container">
          <header className="p-section-title">
            <span>EXCELLENCE ET TRANSPARENCE</span>
            <h2>Pourquoi choisir ProcureAI ?</h2>
            <p>L’alliance de la rigueur institutionnelle et de l’innovation technologique pour une gestion sans faille.</p>
          </header>
          <div className="p-benefit-grid">
            {benefits.map(([Icon, title, text]) => (
              <article key={title}>
                <span><Icon size={26} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="p-section p-tools" id="fonctionnalites">
        <div className="p-container">
          <header className="p-section-title">
            <span>Gestion</span>
            <h2>Outils métiers intégrés</h2>
            <p>L’alliance de la rigueur institutionnelle et de l’innovation technologique pour une gestion sans faille.</p>
          </header>
          <div className="p-tool-grid">
            {tools.map(([Icon, title, text]) => (
              <article key={title}>
                <span><Icon /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="p-section p-ai">
        <div className="p-container p-ai__panel">
          <div className="p-ai__visual">
            <div className="p-ai__orb"><BrainCircuit size={64} /></div>
            <span>PROCURE AI</span>
          </div>
          <div className="p-ai__copy">
            <span className="p-kicker">INTELLIGENCE ARTIFICIELLE</span>
            <h2>Le cerveau derrière chaque décision</h2>
            <p>ProcureAI analyse, compare et sécurise les informations pour permettre aux équipes de prendre des décisions plus rapides et mieux documentées.</p>
            <ul>
              <li><Check size={16} /> Détection des incohérences et des risques</li>
              <li><Check size={16} /> Comparaison objective des offres reçues</li>
              <li><Check size={16} /> Recommandations explicables et traçables</li>
            </ul>
            <Link className="p-text-link" to="/a-propos">Comprendre notre approche <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* Bouton dynamique flottant qui n'apparaît que lorsqu'on dépasse le hero */}
      <aside className={`p-floating-tenders-wrap ${scrolledPastHero ? 'is-visible' : ''}`} aria-label="Accès rapide derniers appels d'offres">
        <button
          type="button"
          className={`p-floating-tenders-btn ${showLatest ? 'is-active' : ''}`}
          onClick={() => {
            const nextState = !showLatest
            setShowLatest(nextState)
            if (nextState) {
              setTimeout(() => {
                document.getElementById('derniers-appels')?.scrollIntoView({ behavior: 'smooth' })
              }, 120)
            }
          }}
          aria-expanded={showLatest}
        >
          <span className="p-badge-pulse" />
          <span className="p-badge-text">
            {showLatest
              ? 'Masquer les derniers appels d’offres'
              : 'Voulez-vous voir les derniers appels d’offres ?'}
          </span>
          <span className="p-badge-icon">
            {showLatest ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
      </aside>
    </main>
  )
}
