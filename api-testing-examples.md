# 🧪 Guide complet pour tester l'API CRM depuis l'extérieur

## 🔗 Informations de base

**URL de base :** `https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api`
**Service Role Key :** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8`
**Votre User ID :** `71003ea5-4d33-42d1-8376-acbd079248fd`

---

## 1. 🖥️ **Via Terminal/Command Line (cURL)**

### Test de santé (sans authentification)
```bash
curl -X GET "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health"
```

### Lister vos prospects
```bash
curl -X GET "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects?user_id=71003ea5-4d33-42d1-8376-acbd079248fd&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8" \
  -H "Content-Type: application/json"
```

### Créer un nouveau prospect
```bash
curl -X POST "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Prospect API",
    "telephone": "+33123456789",
    "adresse": "123 Rue de Test, Paris",
    "site_web": "https://test-api.com",
    "score_seo": 85,
    "message_personnalise": "Créé via API externe",
    "user_id": "71003ea5-4d33-42d1-8376-acbd079248fd"
  }'
```

---

## 2. 🌐 **Via Navigateur Web**

### Test simple dans la console du navigateur
```javascript
// Test de santé
fetch('https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health')
  .then(response => response.json())
  .then(data => console.log('Health:', data));

// Lister les prospects
fetch('https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects?user_id=71003ea5-4d33-42d1-8376-acbd079248fd', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Prospects:', data));
```

---

## 3. 🔧 **Via Postman**

### Configuration de base
1. **Méthode :** GET/POST/PUT/DELETE
2. **URL :** `https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects`
3. **Headers :**
   - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8`
   - `Content-Type`: `application/json`

### Collection Postman (JSON à importer)
```json
{
  "info": {
    "name": "CRM API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health",
          "protocol": "https",
          "host": ["iajfqvvrhbvtgcufcige", "supabase", "co"],
          "path": ["functions", "v1", "api", "health"]
        }
      }
    },
    {
      "name": "Get Prospects",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8"
          }
        ],
        "url": {
          "raw": "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects?user_id=71003ea5-4d33-42d1-8376-acbd079248fd",
          "protocol": "https",
          "host": ["iajfqvvrhbvtgcufcige", "supabase", "co"],
          "path": ["functions", "v1", "api", "prospects"],
          "query": [
            {
              "key": "user_id",
              "value": "71003ea5-4d33-42d1-8376-acbd079248fd"
            }
          ]
        }
      }
    }
  ]
}
```

---

## 4. 🐍 **Via Python**

```python
import requests
import json

# Configuration
BASE_URL = "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8"
USER_ID = "71003ea5-4d33-42d1-8376-acbd079248fd"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Test de santé
def test_health():
    response = requests.get(f"{BASE_URL}/health")
    print("Health:", response.json())

# Lister les prospects
def get_prospects():
    response = requests.get(
        f"{BASE_URL}/prospects",
        headers=headers,
        params={"user_id": USER_ID, "limit": 10}
    )
    print("Prospects:", response.json())

# Créer un prospect
def create_prospect():
    data = {
        "nom": "Test Python API",
        "telephone": "+33987654321",
        "adresse": "456 Avenue Python",
        "site_web": "https://python-test.com",
        "score_seo": 92,
        "message_personnalise": "Créé via Python",
        "user_id": USER_ID
    }
    
    response = requests.post(
        f"{BASE_URL}/prospects",
        headers=headers,
        json=data
    )
    print("Created:", response.json())

# Exécuter les tests
if __name__ == "__main__":
    test_health()
    get_prospects()
    create_prospect()
```

---

## 5. 📱 **Via Node.js/JavaScript**

```javascript
const axios = require('axios');

const BASE_URL = 'https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8';
const USER_ID = '71003ea5-4d33-42d1-8376-acbd079248fd';

const headers = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

// Test de santé
async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('Health:', response.data);
  } catch (error) {
    console.error('Health Error:', error.response?.data || error.message);
  }
}

// Lister les prospects
async function getProspects() {
  try {
    const response = await axios.get(`${BASE_URL}/prospects`, {
      headers,
      params: { user_id: USER_ID, limit: 10 }
    });
    console.log('Prospects:', response.data);
  } catch (error) {
    console.error('Get Prospects Error:', error.response?.data || error.message);
  }
}

// Créer un prospect
async function createProspect() {
  try {
    const data = {
      nom: 'Test Node.js API',
      telephone: '+33555666777',
      adresse: '789 Boulevard Node',
      site_web: 'https://nodejs-test.com',
      score_seo: 88,
      message_personnalise: 'Créé via Node.js',
      user_id: USER_ID
    };

    const response = await axios.post(`${BASE_URL}/prospects`, data, { headers });
    console.log('Created:', response.data);
  } catch (error) {
    console.error('Create Error:', error.response?.data || error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testHealth();
  await getProspects();
  await createProspect();
}

runTests();
```

---

## 6. 🔍 **Outils de test en ligne**

### Hoppscotch (ex-Postwoman)
1. Allez sur https://hoppscotch.io
2. **Method:** GET
3. **URL:** `https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health`
4. Cliquez **Send**

### HTTPie Online
1. Allez sur https://httpie.io/app
2. Entrez la commande :
```
GET https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health
```

---

## 🎯 **Endpoints disponibles**

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| `GET` | `/health` | Test de santé | ❌ Non |
| `GET` | `/prospects` | Lister prospects | ✅ Oui |
| `GET` | `/prospects/:id` | Prospect spécifique | ✅ Oui |
| `POST` | `/prospects` | Créer prospect | ✅ Oui |
| `PUT` | `/prospects/:id` | Modifier prospect | ✅ Oui |
| `DELETE` | `/prospects/:id` | Supprimer prospect | ✅ Oui |

---

## 🔐 **Paramètres importants**

- **Service Role Key :** Obligatoire pour tous les endpoints sauf `/health`
- **user_id :** Recommandé pour filtrer vos données
- **Content-Type :** `application/json` pour les requêtes POST/PUT
- **CORS :** Activé, accessible depuis n'importe quel domaine

---

## ✅ **Réponses attendues**

### Succès (200/201)
```json
{
  "success": true,
  "data": { ... }
}
```

### Erreur (400/401/404/500)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```