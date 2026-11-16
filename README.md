# SunuMarchés (ProcureAI) — Plateforme Intelligente de Gestion des Marchés Publics
### Projet de Fin de Formation (PFF) — ISEP Diamniadio

Plateforme dématérialisée d'assistance et de sécurisation du cycle complet de passation des marchés publics (de la planification à l'attribution et au suivi contractuel), intégrant une assistance par Intelligence Artificielle explicable (OCR, conformité des pièces, détection d'anomalies financières, détection de collusion réseau).

---

## 🔑 Identifiants de Connexion par Acteur / Profil

Pour tester et évaluer chaque espace utilisateur, voici l'ensemble des comptes préconfigurés et prêts à l'emploi.

### 1. Comptes Principaux de Démonstration (5 Acteurs Clés)

> **Mot de passe commun :** `PffDemo-2026!`

| Rôle / Acteur | Nom du compte | Identifiant (Email) | Mot de passe | Espace & Responsabilités Métiers |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Administrateur** | Admin Demo | `admin@marche.gov` | `PffDemo-2026!` | **Administration :** Supervision globale de la plateforme, gestion des comptes utilisateurs, attribution des rôles et habilitations, audit global. |
| **🏛️ Autorité Contractante** | Awa Diallo | `autorite@marche.gov` | `PffDemo-2026!` | **Espace Acheteur :** Création des DAO, publication des appels d'offres, clôture des soumissions, attribution définitive et publication des résultats. |
| **🏢 Fournisseur 1** | Cheikh Ndiaye *(SARL Construction Plus)* | `supplier1@fournisseur.sn` | `PffDemo-2026!` | **Espace Candidat :** Consultation des marchés ouverts, préparation et dépôt d'offres sous pli scellé, obtention du récépissé horodaté avec hash SHA-256. |
| **🏢 Fournisseur 2** | Aminata Ba *(EURL Bâtiment Sud)* | `supplier2@fournisseur.sn` | `PffDemo-2026!` | **Espace Candidat :** Dépôt d'offres concurrentes, suivi de statut (reçu, en évaluation, attribué ou rejeté). |
| **⚖️ Commission d’Évaluation** | Moussa Fall | `commission@marche.gov` | `PffDemo-2026!` | **Espace Commission :** Tenue formelle de la séance d'ouverture des plis (génération du PV), vérification administrative, notation technique et financière assistée par IA. |
| **🔍 Auditeur / Contrôleur** | Fatou Sow | `auditeur@marche.gov` | `PffDemo-2026!` | **Espace Contrôle :** Consultation des journaux d'audit inaltérables, traçabilité des opérations, inspection des alertes IA de suspicion de collusion ou fraude. |

---

### 2. Comptes Complémentaires (Scénarios d'Évaluation Avancés)

> **Mot de passe commun :** `Scenario-2026!`

Ces comptes sont associés à des procédures à différents stades de maturité (marché en cours d'évaluation, marché attribué, exécution de contrat) :

| Rôle / Acteur | Identifiant (Email) | Mot de passe | Contexte & Scénario Métier |
| :--- | :--- | :--- | :--- |
| **🏛️ Autorité (Scénarios)** | `autorite.scenario@marche.gov` | `Scenario-2026!` | Gestionnaire des marchés modèles (informatique, maintenance, mobilier). |
| **⚖️ Commission (Scénarios)** | `commission.scenario@marche.gov` | `Scenario-2026!` | Traitement des dossiers d'évaluation avec pièces conformes et non conformes. |
| **🏢 Fournisseur (Sahel Equipements)** | `scenario.fournisseur1@demo.sn` | `Scenario-2026!` | Candidat ayant déposé une offre actuellement en cours d'évaluation. |
| **🏢 Fournisseur (Teranga Services)** | `scenario.fournisseur2@demo.sn` | `Scenario-2026!` | Attributaire du marché de maintenance active (suivi des jalons et paiements). |
| **🏢 Fournisseur (Bati Sénégal Demo)** | `scenario.fournisseur3@demo.sn` | `Scenario-2026!` | Attributaire du marché de réhabilitation réceptionné avec note finale. |

---

## 🚀 Démarrage Rapide des Composants

### 1. Démarrer le Backend (Node.js Express + PostgreSQL)

```powershell
# Accéder au dossier backend
Set-Location c:\projet_PFF$\projet_PFF-main\Backend

# Installer les dépendances (si pas encore fait)
npm install

# Initialiser et migrer la base PostgreSQL
npm run db:init

# Charger les comptes et données de base (si première installation)
npm run seed
npm run seed:scenarios

# Démarrer le serveur
npm start
```
> Le backend est accessible sur : `http://localhost:4000` (API sur `http://localhost:4000/api`).

### 2. Démarrer le Frontend (React 19 + Vite 8)

```powershell
# Accéder au dossier frontend
Set-Location c:\projet_PFF$\front_marche_public-main\front_marche_public-main

# Démarrer le serveur de développement Vite
npm run dev
```
> L'interface web est accessible sur : `http://localhost:5173`.

### 3. Démarrer le Microservice d'Intelligence Artificielle (FastAPI)

```powershell
# Accéder au dossier IA
Set-Location c:\projet_PFF$\projet_PFF-main\IA\AI_Service

# Activer l'environnement virtuel et installer les dépendances
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Lancer le service IA
uvicorn main:app --host 127.0.0.1 --port 5000
```
> Le microservice IA est accessible sur : `http://127.0.0.1:5000`.

---

## 🔒 Principes Clés de Sécurité et Métier Implémentés

1. **Scellement Cryptographique des Plis (Zero-Knowledge) :**
   - Avant la date limite de soumission et la séance officielle d'ouverture, les montants financiers et documents des offres sont scellés et inaccessibles côté backend et frontend.
   - Les candidatures apparaissent sous forme d'empreintes anonymisées : *"Pli scellé n°X"*.
2. **Procès-Verbal d'Ouverture des Plis :**
   - La commission d'évaluation déclenche formellement la séance d'ouverture des plis via l'action dédiée, horodatant l'événement et générant le PV d'ouverture.
3. **Non-Répudiation & Horodatage (SHA-256) :**
   - Chaque dépôt d'offre génère un récépissé électronique inaltérable contenant l'empreinte SHA-256 de la soumission.
4. **Assistance IA Explicable & Non-Décisionnelle :**
   - L'IA intervient en support (OCR des attestations fiscales/sociales, détection statistique des anomalies de prix via Isolation Forest, graphes de collusion réseau).
   - Aucune attribution n'est automatique : la décision souveraine appartient à la commission et à l'autorité contractante.
5. **Traçabilité & Journaux d'Audit :**
   - Enregistrement immuable de chaque action sensible dans les logs d'audit avec IP, horodatage et rôle de l'opérateur.

