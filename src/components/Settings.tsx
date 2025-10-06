import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Key, Copy, Check, Eye, EyeOff, RefreshCw, Database, ExternalLink } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSupabaseKeys, setShowSupabaseKeys] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Pour le moment, on utilise le token d'accès comme clé API
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setApiKey(session.access_token);
        }
        
        // Récupérer les variables d'environnement Supabase
        setSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
        setSupabaseAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const regenerateApiKey = async () => {
    try {
      // Pour le moment, on recharge la session pour obtenir un nouveau token
      await supabase.auth.refreshSession();
      await loadUserData();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos paramètres de compte et votre clé API
        </p>
      </div>

      {/* Informations du compte */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Informations du Compte</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Utilisateur
              </label>
              <input
                type="text"
                value={user?.id || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compte créé le
              </label>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dernière connexion
              </label>
              <input
                type="text"
                value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Supabase */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configuration Supabase</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">Informations du projet Supabase</h3>
            <p className="text-purple-800 text-sm">
              Pour utiliser l'API publique, vous devez utiliser votre <strong>Service Role Key</strong> (pas l'anon key).
              Votre API est accessible à l'adresse : <code className="bg-white px-2 py-1 rounded">{supabaseUrl}/functions/v1/api</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL du projet Supabase
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={supabaseUrl}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
              </div>
              
              <button
                onClick={() => copyToClipboard(supabaseUrl, 'supabaseUrl')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {copiedField === 'supabaseUrl' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copié!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
              
              <a
                href={`${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/settings/api`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Role Key (pour l'API publique)
            </label>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
              <p className="text-yellow-800 text-sm">
                ⚠️ <strong>Important :</strong> Pour l'API publique, utilisez votre <strong>Service Role Key</strong> 
                disponible dans Settings → API → Project API keys → service_role (secret).
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showSupabaseKeys ? 'text' : 'password'}
                  value="Récupérez votre Service Role Key depuis le dashboard Supabase"
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-yellow-50 font-mono text-sm text-yellow-800"
                />
                <button
                  onClick={() => setShowSupabaseKeys(!showSupabaseKeys)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showSupabaseKeys ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <button
                disabled
                className="px-3 py-2 bg-gray-400 text-white rounded-lg flex items-center space-x-2 cursor-not-allowed"
              >
                {copiedField === 'serviceKey' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copié!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Récupérer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🔗 URL complète de votre API</h4>
            <div className="bg-white rounded p-3 font-mono text-sm border">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">{supabaseUrl}/functions/v1/api</span>
                <button
                  onClick={() => copyToClipboard(`${supabaseUrl}/functions/v1/api`, 'apiUrl')}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  {copiedField === 'apiUrl' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✅ Endpoints disponibles</h4>
            <div className="space-y-1 text-sm text-green-800">
              <div>• <code>GET {supabaseUrl}/functions/v1/api/health</code> - Test de santé (sans auth)</div>
              <div>• <code>GET {supabaseUrl}/functions/v1/api/prospects?user_id=YOUR_USER_ID</code> - Lister les prospects</div>
              <div>• <code>POST {supabaseUrl}/functions/v1/api/prospects</code> - Créer un prospect (user_id requis)</div>
              <div>• <code>PUT {supabaseUrl}/functions/v1/api/prospects/:id?user_id=YOUR_USER_ID</code> - Modifier un prospect</div>
              <div>• <code>DELETE {supabaseUrl}/functions/v1/api/prospects/:id?user_id=YOUR_USER_ID</code> - Supprimer un prospect</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">👤 Votre User ID</h4>
            <div className="bg-white rounded p-3 font-mono text-sm border">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">{user?.id || 'Non connecté'}</span>
                <button
                  onClick={() => copyToClipboard(user?.id || '', 'userId')}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  disabled={!user?.id}
                >
                  {copiedField === 'userId' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-blue-800 text-sm mt-2">
              Utilisez cet ID dans vos requêtes API pour filtrer vos données.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">🔑 Comment récupérer votre Service Role Key</h4>
            <div className="space-y-2 text-sm text-red-800">
              <div>1. Allez sur <a href={`${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/settings/api`} target="_blank" rel="noopener noreferrer" className="underline">votre dashboard Supabase</a></div>
              <div>2. Section "Project API keys"</div>
              <div>3. Copiez la clé <strong>"service_role"</strong> (pas l'anon key)</div>
              <div>4. Utilisez cette clé dans vos requêtes API</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clé API */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Clé API</h2>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">À propos de votre clé API</h3>
            <p className="text-blue-800 text-sm">
              Pour l'API publique, vous devez utiliser votre <strong>Service Role Key</strong> Supabase.
              Cette clé contourne RLS et donne accès complet à vos données.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre clé API (Service Role Key requise)
            </label>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
              <p className="text-orange-800 text-sm">
                ⚠️ La clé affichée ci-dessous est votre token utilisateur. Pour l'API publique, 
                utilisez votre <strong>Service Role Key</strong> depuis le dashboard Supabase.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-orange-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <button
                onClick={() => copyToClipboard(apiKey, 'apiKey')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {copiedField === 'apiKey' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copié!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
              
              <button
                onClick={regenerateApiKey}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Régénérer</span>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Sécurité importante</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Ne partagez jamais votre Service Role Key publiquement</li>
              <li>• Utilisez HTTPS pour toutes les requêtes API</li>
              <li>• La Service Role Key contourne toutes les règles de sécurité RLS</li>
              <li>• Stockez la clé de manière sécurisée dans vos variables d'environnement</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exemple d'utilisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exemple d'utilisation</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Requête cURL</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{`curl -X GET "${supabaseUrl}/functions/v1/api/prospects" \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json"`}</pre>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">JavaScript/Node.js</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{`const response = await fetch('${supabaseUrl}/functions/v1/api/prospects', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques d'utilisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Utilisation de l'API</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Requêtes aujourd'hui</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Requêtes ce mois</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">100/min</div>
            <div className="text-sm text-gray-600">Limite de taux</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;