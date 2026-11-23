import { Landmark, Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

function PublicLogo({ light = false }) {
  return <Link className={`p-brand ${light ? 'p-brand--light' : ''}`} to="/"><span><Landmark size={16} /></span><b>Procure</b>AI</Link>
}

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="public-shell p-site">
      <header className="p-header">
        <PublicLogo light />
        <button
          className="p-header__menu"
          type="button"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav id="public-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Navigation principale">
          <NavLink to="/" end onClick={closeMenu}>Accueil</NavLink>
          <NavLink to="/a-propos" onClick={closeMenu}>À propos</NavLink>
          <NavLink to="/appels-offres" onClick={closeMenu}>Appels d’offres</NavLink>
          <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
          <Link className="p-button p-header__register" to="/inscription" onClick={closeMenu}>Créer un compte</Link>
        </nav>
      </header>
      <Outlet />
      <footer className="p-footer">
        <div className="p-container p-footer__grid">
          <div className="p-footer__about"><PublicLogo light /><p>La plateforme intelligente qui simplifie, sécurise et modernise la commande publique.</p></div>
          <div><b>Navigation</b><Link to="/">Accueil</Link><Link to="/a-propos">À propos</Link><Link to="/appels-offres">Appels d’offres</Link></div>
          <div><b>Contactez-nous</b><span><MapPin size={13} /> Dakar, Sénégal</span><span><Phone size={13} /> +221 33 000 00 00</span><a href="mailto:contact@procureai.sn"><Mail size={13} /> contact@procureai.sn</a></div>
        </div>
        <div className="p-footer__bottom"><span>© 2025 ProcureAI. Tous droits réservés.</span></div>
      </footer>
    </div>
  )
}
