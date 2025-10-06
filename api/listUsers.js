const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const supabaseUrl = 'https://iajfqvvrhbvtgcufcige.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhamZxdnZyaGJ2dGdjdWZjaWdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzcxMjAyOSwiZXhwIjoyMDczMjg4MDI5fQ.cl-9SXZP9eQw5JbQ_HS-TwCGpMRips8hYMhiLmX4fD8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.post('/api/list-users', async (req, res) => {
  const { email } = req.body;
  if (email !== 'stems1210@gmail.com') {
    return res.status(403).json({ error: 'Accès refusé.' });
  }
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data.users });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
