# CRM Digital Marketing

Une application CRM complète avec API REST publique pour la gestion de prospects et l'automatisation marketing.

## 🚀 Fonctionnalités

- **Gestion de Prospects** : CRUD complet avec scoring SEO
- **Tables Personnalisées** : Créez vos propres structures de données
- **API REST Publique** : Intégration avec vos outils externes
- **Outils de Prospection** : Workflows automatisés avec N8N
- **Dashboard Analytics** : Suivi des performances en temps réel

## 🔗 API Publique

L'API est accessible via Supabase Edge Functions :

### Base URL
```
https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api
```

### Authentification
```bash
Authorization: Bearer YOUR_SUPABASE_TOKEN
```

### Endpoints Disponibles

#### Prospects
- `GET /functions/v1/api/prospects` - Lister les prospects
- `GET /functions/v1/api/prospects/:id` - Récupérer un prospect
- `POST /functions/v1/api/prospects` - Créer un prospect
- `PUT /functions/v1/api/prospects/:id` - Modifier un prospect
- `DELETE /functions/v1/api/prospects/:id` - Supprimer un prospect

#### Tables Personnalisées
- `GET /functions/v1/api/tables/:tableName` - Lister les enregistrements
- `POST /functions/v1/api/tables/:tableName` - Créer un enregistrement
- `PUT /functions/v1/api/tables/:tableName/:id` - Modifier un enregistrement
- `DELETE /functions/v1/api/tables/:tableName/:id` - Supprimer un enregistrement

#### Santé de l'API
- `GET /functions/v1/api/health` - Vérifier le statut

### Exemple d'utilisation

```bash
# Lister les prospects
curl -X GET "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Créer un prospect
curl -X POST "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont",
    "telephone": "+33123456789",
    "site_web": "https://exemple.com",
    "score_seo": 85
  }'
```

## 🛠️ Installation

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Configurer Supabase dans `.env`
4. Démarrer l'application : `npm run dev`

## 📦 Déploiement

L'application est déployée sur :
- **Frontend** : https://crm-digital-marketin-8pe6.bolt.host
- **API** : https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api

## 🔧 Technologies

- **Frontend** : React + TypeScript + Tailwind CSS
- **API** : Supabase Edge Functions (Deno)
- **Base de données** : PostgreSQL (Supabase)
- **Authentification** : Supabase Auth
- **Hébergement** : Bolt Hosting (Frontend) + Supabase (API)

## 📚 Documentation

La documentation complète de l'API est disponible dans l'application à la section "Documentation API".