# SunuMarchés (ProcureAI) — Plateforme Intelligente de Gestion des Marchés Publics
### Projet de Fin de Formation (PFF) — ISEP Diamniadio

Plateforme dématérialisée d'assistance et de sécurisation du cycle complet de passation des marchés publics (de la planification à l'attribution et au suivi contractuel), intégrant une assistance par Intelligence Artificielle explicable (OCR, conformité des pièces, détection d'anomalies financières, détection de collusion réseau).

---

## 🔑 Identifiants de Connexion par Acteur / Profil

Pour tester et évaluer chaque espace utilisateur, voici les comptes préconfigurés et prêts à l'emploi.

### 1. Comptes Principaux de Démonstration

> **Mot de passe commun :** `PffDemo-2026!`

| Rôle / Acteur | Nom du compte | Identifiant (Email) | Mot de passe | Espace & Responsabilités Métiers |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Administrateur** | Admin Demo | `admin@marche.gov` | `PffDemo-2026!` | Supervision globale de la plateforme, gestion des comptes utilisateurs, attribution des rôles et permissions. |
| **🏛️ Autorité Contractante** | Awa Diallo | `autorite@marche.gov` | `PffDemo-2026!` | Création des appels d'offres, publication, gestion des pièces de consultation (DAO), attribution définitive des marchés. |
| **🏢 Fournisseur 1** | Cheikh Ndiaye *(SARL Construction Plus)* | `supplier1@fournisseur.sn` | `PffDemo-2026!` | Consultation des opportunités, soumission électronique sous pli scellé, obtention de l'accusé de réception horodaté (SHA-256). |
| **🏢 Fournisseur 2** | Aminata Ba *(EURL Bâtiment Sud)* | `supplier2@fournisseur.sn` | `PffDemo-2026!` | Dépôt de candidatures concurrentes, consultation de son portefeuille d'offres et résultats. |
| **⚖️ Commission d’Évaluation** | Moussa Fall | `commission@marche.gov` | `PffDemo-2026!` | Séance formelle d'ouverture des plis (PV), examen de conformité assisté par IA, notation technique/financière, proposition de classement. |
| **🔍 Auditeur / Contrôleur** | Fatou Sow | `auditeur@marche.gov` | `PffDemo-2026!` | Contrôle de légalité et régularité, consultation des journaux d'audit infalsifiables, inspection des alertes IA de collusion/fraude. |

---

### 2. Comptes Complémentaires (Scénarios d'Évaluation Avancés)

> **Mot de passe commun :** `Scenario-2026!`

Ces comptes sont associés à des procédures réalistes à différents stades de maturité (marché en évaluation, marché en cours d'exécution, marché clôturé) :

| Rôle / Acteur | Identifiant (Email) | Mot de passe | Contexte & Scénario Associé |
| :--- | :--- | :--- | :--- |
| **🏛️ Autorité (Scénarios)** | `autorite.scenario@marche.gov` | `Scenario-2026!` | Gestionnaire des marchés modèles (informatique, maintenance, mobilier). |
| **⚖️ Commission (Scénarios)** | `commission.scenario@marche.gov` | `Scenario-2026!` | Traitement des dossiers d'évaluation avec pièces conformes et non conformes. |
| **🏢 Fournisseur (Sahel Equipements)** | `scenario.fournisseur1@demo.sn` | `Scenario-2026!` | Candidat ayant déposé une offre actuellement en cours d'évaluation. |
| **🏢 Fournisseur (Teranga Services)** | `scenario.fournisseur2@demo.sn` | `Scenario-2026!` | Attributaire du marché de maintenance active (suivi des jalons et paiements). |
| **🏢 Fournisseur (Bati Sénégal Demo)** | `scenario.fournisseur3@demo.sn` | `Scenario-2026!` | Attributaire du marché de réhabilitation réceptionné avec note finale. |

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend (API Express + PostgreSQL)

```powershell
Set-Location c:\projet_PFF$\projet_PFF-main\Backend
npm install
# Initialiser la base de données PostgreSQL
npm run db:init
# Charger les comptes et données de base (si base vide)
npm run seed
# Charger les scénarios complets
npm run seed:scenarios
# Lancer le serveur backend
npm start
```
> Le serveur backend écoute sur `http://localhost:4000` (API sur `http://localhost:4000/api`).

### 2. Démarrer le Frontend (React 19 + Vite 8)

```powershell
Set-Location c:\projet_PFF$\front_marche_public-main\front_marche_public-main
npm install
npm run dev
```
> L'interface web est accessible sur `http://localhost:5173`.

### 3. Démarrer le Microservice IA (Python + FastAPI)

```powershell
Set-Location c:\projet_PFF$\projet_PFF-main\IA\AI_Service
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5000
```
> Le service d'IA écoute sur `http://127.0.0.1:5000`.

---

## 🔒 Principes Clés de Sécurité et Métier

1. **Scellement Cryptographique des Plis :**
   - Avant la date limite et la tenue de la séance formelle d'ouverture des plis, le contenu de chaque offre (montant financier, mémoire technique, pièces justificatives) est **strictement scellé**.
   - Aucun superviseur ne peut consulter les offres concurrentes avant l'ouverture officielle.
2. **Non-Répudiation (SHA-256) :**
   - Chaque dépôt d'offre génère un récépissé électronique inaltérable avec empreinte SHA-256 horodatée.
3. **Assistance IA Non-Décisionnelle :**
   - L'IA produit des analyses de conformité documentaire (OCR), des alertes statistiques de prix (Isolation Forest) et des graphes de collusion réseau. Elle assiste la commission sans jamais se substituer à la décision humaine.
4. **Traçabilité Totale (Audit Logs) :**
   - Chaque action sensible (création d'AO, soumission, ouverture des plis, notation, attribution) est horodatée et enregistrée de manière infalsifiable avec l'identifiant utilisateur et l'adresse IP.
