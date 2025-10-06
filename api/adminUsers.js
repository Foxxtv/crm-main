const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const port = process.env.PORT || 4000;

// Utilisez les variables d'environnement ou fallback sur les valeurs par défaut
const supabaseUrl = process.env.SUPABASE_URL || 'https://iajfqvvrhbvtgcufcige.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Middleware d'autorisation admin (à personnaliser en prod)
function requireAdmin(req, res, next) {
  // Exemple simple : vérification d'un email transmis en query
  const email = req.query.email;
  if (email !== 'stems1210@gmail.com') {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }
  next();
}

// Fonction pour lister les utilisateurs authentifiés
async function listSupabaseUsers() {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error.message);
      return [];
    }
    // Filtrer les utilisateurs confirmés
    const authenticatedUsers = users.filter(user => user.email_confirmed_at !== null);
    return authenticatedUsers;
  } catch (err) {
    console.error('Une erreur inattendue est survenue:', err);
    return [];
  }
}

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await listSupabaseUsers();
  if (users.length > 0) {
    res.json({ success: true, users });
  } else {
    res.status(500).json({ success: false, message: 'Impossible de récupérer les utilisateurs.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
