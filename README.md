# RHConnect — Frontend

Plateforme SaaS de Gestion RH Vacataires — ISM Dakar  
Stack : Next.js 14 · React 18 · TypeScript · Tailwind CSS

---

## Prérequis

- Node.js v18+
- npm v9+

---

## Installation

```bash
git clone https://github.com/dev-rhconnect/rhconnect-frontend.git
cd rhconnect-frontend
npm install
cp .env.local.example .env.local
npm run dev
```

L'application est accessible sur : `http://localhost:3000`

---

## Structure du projet

```
app/
├── (auth)/
│   └── login/          # Page de connexion
├── (dashboard)/
│   ├── admin/          # Dashboard Administrateur IT
│   ├── responsable/    # Dashboard Responsable de programme
│   ├── attache/        # Dashboard Attaché de classe
│   ├── finance/        # Dashboard Relais Finance (Awa)
│   └── vacataire/      # Dashboard Vacataire
components/
├── ui/                 # Composants réutilisables
├── forms/              # Formulaires métier
└── layout/             # Navigation, sidebar
services/               # Appels API Axios
hooks/                  # Hooks React Query
store/                  # État global Zustand
types/                  # Types TypeScript
```

---

## Branches

| Membre | Branche |
|---|---|
| Marie DIAGNE | sprint1/feature/auth |
| Mame Coumba SALL | sprint1/feature/vacataires |
| Merveille Joy AKODEKOU | sprint1/feature/interventions |
| Mouhamad Al Amin FALL | sprint1/feature/releves |
| Ndeye Fatou GUEYE | sprint1/feature/paie |
| Diaynaba SOW | sprint1/feature/dashboard |

---

## Équipe

Licence 3 GLRS & CDSD · ISM Dakar · 2025–2026  
Encadreur : M. Birane B. WANE
