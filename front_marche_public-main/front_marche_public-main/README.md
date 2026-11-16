# SunuMarchés (ProcureAI) — Interface Utilisateur Frontend
### Projet de Fin de Formation (PFF) — ISEP Diamniadio

Ce sous-projet contient l'application web frontend développée avec React 19, Vite 8, Lucide React et TailwindCSS/CSS modulaire.

---

## 🔑 Identifiants de Connexion par Acteur / Profil

Pour tester l'application avec les différents rôles, utilisez les comptes ci-dessous :

### 1. Comptes de Démonstration Principaux

> **Mot de passe commun :** `PffDemo-2026!`

| Rôle / Acteur | Identifiant (Email) | Mot de passe | Rôle et Permissions dans l'interface |
| :--- | :--- | :--- | :--- |
| **👑 Administrateur** | `admin@marche.gov` | `PffDemo-2026!` | Tableau de bord admin, gestion des utilisateurs, rôles et paramètres système. |
| **🏛️ Autorité Contractante** | `autorite@marche.gov` | `PffDemo-2026!` | Création/publication d'appels d'offres, attribution finale, gestion des DAO. |
| **🏢 Fournisseur 1** | `supplier1@fournisseur.sn` | `PffDemo-2026!` | Consultation des offres, dépôt sous pli scellé, récépissé SHA-256. *(SARL Construction Plus)* |
| **🏢 Fournisseur 2** | `supplier2@fournisseur.sn` | `PffDemo-2026!` | Dépôt d'offres concurrentes, suivi des candidatures. *(EURL Bâtiment Sud)* |
| **⚖️ Commission d’Évaluation** | `commission@marche.gov` | `PffDemo-2026!` | Séance d'ouverture des plis (PV), évaluation technique/financière assistée par IA. |
| **🔍 Auditeur / Contrôleur** | `auditeur@marche.gov` | `PffDemo-2026!` | Consultation des journaux d'audit, traçabilité et alertes IA de collusion/anomalies. |

---

### 2. Comptes Scénarios Avancés

> **Mot de passe commun :** `Scenario-2026!`

| Rôle / Acteur | Identifiant (Email) | Mot de passe | Contexte |
| :--- | :--- | :--- | :--- |
| **🏛️ Autorité (Scénarios)** | `autorite.scenario@marche.gov` | `Scenario-2026!` | Procédures types déjà peuplées |
| **⚖️ Commission (Scénarios)** | `commission.scenario@marche.gov` | `Scenario-2026!` | Séances d'évaluation modèles |
| **🏢 Fournisseur (Sahel)** | `scenario.fournisseur1@demo.sn` | `Scenario-2026!` | Offre en cours d'évaluation |
| **🏢 Fournisseur (Teranga)** | `scenario.fournisseur2@demo.sn` | `Scenario-2026!` | Titulaire d'un contrat de maintenance en exécution |
| **🏢 Fournisseur (Bati Sénégal)** | `scenario.fournisseur3@demo.sn` | `Scenario-2026!` | Titulaire d'un contrat réceptionné avec note finale |

---

## 💻 Démarrage du Frontend

```powershell
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.
Assurez-vous que le backend tourne sur le port `4000` (`http://localhost:4000/api`).

