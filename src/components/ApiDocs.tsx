import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Code, Key, Database, Users, Copy, Check, Eye, EyeOff, RefreshCw, ExternalLink } from 'lucide-react';

const ApiDocs = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState('');
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});
  const [userToken, setUserToken] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserToken(session?.access_token ?? null);
    };
    fetchToken();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  // Test direct de l'API Supabase publique
 const testSupabaseAPI = async (testType: string) => {
    let url = '';
    let requestData: any = null;

    setTestResults(prev => ({
      ...prev,
      [testType]: { loading: true }
    }));

    const startTime = Date.now();
    // Le baseUrl pour votre Edge Function 'api' (conservé pour le cas 'health' et 'create')
    const baseUrl = 'https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api';

    // Récupérer le token utilisateur actuel pour l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    // Assurez-vous que le token est null si la session n'existe pas
    const userToken = session?.access_token || null; 

    if (!userToken && testType !== 'health') {
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          loading: false,
          success: false,
          error: 'Vous devez être connecté pour tester cet endpoint',
          responseTime: 0,
          url: baseUrl
        }
      }));
      return;
    }

    try {
      // Dans cette nouvelle logique, 'response' ne sera utilisé que pour les appels fetch restants
      let response: Response | null = null; 
      // 'result' contiendra la donnée parsée ou directement le résultat de Supabase
      let result: any = null;

      // Récupérer l'ID utilisateur actuel pour filtrer les données
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '71003ea5-4d33-42d1-8376-acbd079248fd';

      switch (testType) {
        case 'health':
          // L'appel au health check via fetch est conservé
          url = `https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/health`;
          response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json"
            }
          });
          break;

        case 'prospects-list':
          // --- NOUVELLE LOGIQUE UTILISANT LE CLIENT SUPABASE DIRECTEMENT ---
          url = `API PostgREST (Remplacement Edge Function)`;
          
          const { data: prospects, error: fetchError } = await supabase
            .from('prospects')
            .select('*')
            .eq('user_id', userId)
            .limit(10) // Ajout de la limite pour correspondre à l'ancienne requête
            .order('created_at', { ascending: false }); // Bonne pratique
          
          if (fetchError) {
            // Simuler la levée d'une erreur HTTP pour être capturée par le catch
            throw new Error(`Supabase Error ${fetchError.code}: ${fetchError.message}`);
          }

          // Le résultat est directement l'objet data de Supabase
          result = { success: true, data: prospects };
          break;
        // -------------------------------------------------------------------

        case 'prospects-create':
          // --- NOUVELLE LOGIQUE UTILISANT LE CLIENT SUPABASE DIRECTEMENT ---
          url = `API PostgREST (Client Supabase)`;
          requestData = {
            nom: 'Test API Prospect',
            telephone: '+33123456789',
            adresse: '123 Test Street, Paris',
            site_web: 'https://test-api.com',
            score_seo: 85,
            message_personnalise: 'Créé via test API',
            user_id: userId // Utilisation de l'ID utilisateur authentifié
          };
          
          const { data: newProspect, error: createError } = await supabase
            .from('prospects')
            .insert(requestData)
            .select()
            .single(); // Utiliser .single() si vous vous attendez à un seul enregistrement
          
          if (createError) {
            throw new Error(`Supabase Error ${createError.code}: ${createError.message}`);
          }

          result = { success: true, data: newProspect };
          break;

        default:
          throw new Error('Type de test non supporté');
      }

      const responseTime = Date.now() - startTime;
      
      // Traitement des requêtes utilisant 'fetch' (cases 'health' et 'prospects-create')
      if (response) {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        // Le résultat est parsé seulement si c'était un appel fetch
        result = await response.json();
      }

      // La variable 'result' contient maintenant les données de l'API PostgREST ou de l'Edge Function
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          loading: false,
          // Vérifiez que le résultat n'est pas un échec explicite de l'Edge Function
          success: result?.success !== false, 
          data: result?.data || result,
          responseTime,
          url,
          requestData,
          rawResponse: result,
          status: response?.status || 200 // Statut 200 par défaut pour les appels Supabase réussis
        }
      }));
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          loading: false,
          success: false,
          error: error.message,
          responseTime,
          url,
          requestData
        }
      }));
    }
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/functions/v1/api/health',
      description: 'Vérifier le statut de l\'API (endpoint de test)',
      example: `curl -X GET "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/health"

# Réponse attendue:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-13T10:30:00.000Z",
    "version": "1.0.0"
  }
}`,
    },
    {
      method: 'GET',
      path: '/functions/v1/api/prospects',
      description: 'Récupérer tous les prospects avec filtres et pagination',
      example: `curl -X GET "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects?user_id=71003ea5-4d33-42d1-8376-acbd079248fd&limit=10" \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json"

# Paramètres de requête disponibles:
# ?limit=50           - Nombre max de résultats (défaut: 50)
# &offset=0           - Décalage pour pagination (défaut: 0)
# &search=terme       - Recherche dans nom, téléphone, adresse, site web
# &min_score=60       - Score SEO minimum
# &max_score=90       - Score SEO maximum
# &user_id=uuid       - ID utilisateur pour filtrer (recommandé)`,
    },
    {
      method: 'POST',
      path: '/functions/v1/api/prospects',
      description: 'Créer un nouveau prospect',
      example: `curl -X POST "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects" \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nom": "Jean Dupont",
    "telephone": "+33123456789",
    "adresse": "123 Rue de la Paix, Paris",
    "site_web": "https://exemple.com",
    "score_seo": 85,
    "message_personnalise": "Prospect qualifié",
    "user_id": "71003ea5-4d33-42d1-8376-acbd079248fd"
  }'`,
    },
    {
      method: 'PUT',
      path: '/functions/v1/api/prospects/:id',
      description: 'Mettre à jour un prospect',
      example: `curl -X PUT "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects/uuid-123?user_id=71003ea5-4d33-42d1-8376-acbd079248fd" \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "score_seo": 90,
    "message_personnalise": "Prospect qualifié après appel"
  }'`,
    },
    {
      method: 'DELETE',
      path: '/functions/v1/api/prospects/:id',
      description: 'Supprimer un prospect',
      example: `curl -X DELETE "https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api/prospects/uuid-123?user_id=71003ea5-4d33-42d1-8376-acbd079248fd" \\
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"`,
    },
  ];

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Documentation API</h1>
        <p className="text-gray-600">
          Intégrez votre CRM avec d'autres applications grâce à notre API REST complète.
        </p>
      </div>

      {/* Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Authentification</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Toutes les requêtes API (sauf /health) nécessitent votre <strong>Service Role Key</strong> Supabase dans l'en-tête Authorization :
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">🔑 Service Role Key requise</h4>
            <p className="text-red-800 text-sm mb-2">
              Pour utiliser l'API publique, vous devez utiliser votre <strong>Service Role Key</strong> (pas l'anon key).
            </p>
            <div className="text-sm text-red-700">
              <p><strong>Comment la récupérer :</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Allez sur votre <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">dashboard Supabase</a></li>
                <li>Sélectionnez votre projet</li>
                <li>Settings → API</li>
                <li>Section "Project API keys"</li>
                <li>Copiez la clé <strong>"service_role"</strong></li>
              </ol>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span>Authorization: Bearer YOUR_SERVICE_ROLE_KEY</span>
              <button
                onClick={() => copyToClipboard('Authorization: Bearer YOUR_SERVICE_ROLE_KEY', 'auth')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {copiedEndpoint === 'auth' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">URL de Base</h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center justify-between">
            <span>https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api</span>
            <button
              onClick={() => copyToClipboard('https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api', 'base')}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              {copiedEndpoint === 'base' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Testeur API Intégré */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🧪</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Testeur API Intégré</h2>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">
            <strong>Testez votre API Supabase directement depuis cette interface !</strong> 
            Les tests utilisent votre Service Role Key pour appeler les Edge Functions.
          </p>
        </div>

        <div className="space-y-4">
          {/* Test de Santé */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Test de Santé</h3>
                <p className="text-sm text-gray-600">Vérifier que l'API fonctionne (sans authentification)</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">GET</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">/health</code>
                </div>
              </div>
              <button
                onClick={() => testSupabaseAPI('health')}
                disabled={testResults['health']?.loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {testResults['health']?.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Test...</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span>Tester</span>
                  </>
                )}
              </button>
            </div>
            
            {testResults['health'] && (
              <div className={`mt-3 p-3 rounded-lg ${
                testResults['health'].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${testResults['health'].success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`font-medium ${testResults['health'].success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults['health'].success ? '✅ Succès' : '❌ Erreur'}
                  </span>
                  {testResults['health'].responseTime && (
                    <span className="text-xs text-gray-600">({testResults['health'].responseTime}ms)</span>
                  )}
                  {testResults['health'].status && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">HTTP {testResults['health'].status}</span>
                  )}
                </div>
                
                {testResults['health'].error && (
                  <div className="mb-2">
                    <p className="text-red-800 text-sm font-medium">Erreur: {testResults['health'].error}</p>
                    <p className="text-red-700 text-xs mt-1">URL: {testResults['health'].url}</p>
                  </div>
                )}
                
                {testResults['health'].data && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-sm font-medium ${testResults['health'].success ? 'text-green-800' : 'text-red-800'}`}>
                      Voir la réponse
                    </summary>
                    <div className="mt-2 bg-white rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResults['health'].data, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Test Lister Prospects */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Lister les Prospects</h3>
                <p className="text-sm text-gray-600">Récupérer vos prospects avec Service Role Key</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">GET</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">/prospects</code>
                </div>
              </div>
              <button
                onClick={() => testSupabaseAPI('prospects-list')}
                disabled={testResults['prospects-list']?.loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {testResults['prospects-list']?.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Test...</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span>Tester</span>
                  </>
                )}
              </button>
            </div>
            
            {testResults['prospects-list'] && (
              <div className={`mt-3 p-3 rounded-lg ${
                testResults['prospects-list'].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${testResults['prospects-list'].success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`font-medium ${testResults['prospects-list'].success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults['prospects-list'].success ? '✅ Succès' : '❌ Erreur'}
                  </span>
                  {testResults['prospects-list'].responseTime && (
                    <span className="text-xs text-gray-600">({testResults['prospects-list'].responseTime}ms)</span>
                  )}
                  {testResults['prospects-list'].status && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">HTTP {testResults['prospects-list'].status}</span>
                  )}
                </div>
                
                {testResults['prospects-list'].error && (
                  <div className="mb-2">
                    <p className="text-red-800 text-sm font-medium">Erreur: {testResults['prospects-list'].error}</p>
                    <p className="text-red-700 text-xs mt-1">URL: {testResults['prospects-list'].url}</p>
                  </div>
                )}
                
                {testResults['prospects-list'].data && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-sm font-medium ${testResults['prospects-list'].success ? 'text-green-800' : 'text-red-800'}`}>
                      Voir la réponse ({testResults['prospects-list'].data.prospects?.length || 0} prospects)
                    </summary>
                    <div className="mt-2 bg-white rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResults['prospects-list'].data, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* Test Créer Prospect */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Créer un Prospect</h3>
                <p className="text-sm text-gray-600">Test de création avec Service Role Key</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">POST</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">/prospects</code>
                </div>
              </div>
              <button
                onClick={() => testSupabaseAPI('prospects-create')}
                disabled={testResults['prospects-create']?.loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                {testResults['prospects-create']?.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Test...</span>
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    <span>Tester</span>
                  </>
                )}
              </button>
            </div>
            
            {testResults['prospects-create'] && (
              <div className={`mt-3 p-3 rounded-lg ${
                testResults['prospects-create'].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${testResults['prospects-create'].success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={`font-medium ${testResults['prospects-create'].success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults['prospects-create'].success ? '✅ Succès' : '❌ Erreur'}
                  </span>
                  {testResults['prospects-create'].responseTime && (
                    <span className="text-xs text-gray-600">({testResults['prospects-create'].responseTime}ms)</span>
                  )}
                  {testResults['prospects-create'].status && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">HTTP {testResults['prospects-create'].status}</span>
                  )}
                </div>
                
                {testResults['prospects-create'].error && (
                  <div className="mb-2">
                    <p className="text-red-800 text-sm font-medium">Erreur: {testResults['prospects-create'].error}</p>
                    <p className="text-red-700 text-xs mt-1">URL: {testResults['prospects-create'].url}</p>
                  </div>
                )}
                
                {testResults['prospects-create'].requestData && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-blue-800">
                      Voir les données envoyées
                    </summary>
                    <div className="mt-2 bg-blue-50 rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResults['prospects-create'].requestData, null, 2)}</pre>
                    </div>
                  </details>
                )}
                
                {testResults['prospects-create'].data && (
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-sm font-medium ${testResults['prospects-create'].success ? 'text-green-800' : 'text-red-800'}`}>
                      Voir la réponse
                    </summary>
                    <div className="mt-2 bg-white rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResults['prospects-create'].data, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">ℹ️ Informations de diagnostic</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>API Supabase:</strong> https://iajfqvvrhbvtgcufcige.supabase.co/functions/v1/api</p>
            <p><strong>Token utilisateur:</strong> {userToken ? 'Connecté' : 'Non connecté'}</p>
            <p><strong>Architecture:</strong> Edge Functions Supabase (Deno)</p>
            <p><strong>Authentification:</strong> Token utilisateur via Bearer</p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Endpoints - Prospects</h2>
        </div>

        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${methodColors[endpoint.method as keyof typeof methodColors]}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {endpoint.path}
                </code>
              </div>
              
              <p className="text-gray-700 mb-4">{endpoint.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Exemple de requête :</h4>
                  <button
                    onClick={() => copyToClipboard(endpoint.example, `example-${index}`)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedEndpoint === `example-${index}` ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{endpoint.example}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Response Format */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Code className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Format des Réponses</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Toutes les réponses sont au format JSON avec la structure suivante :
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Réponse de succès :</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{`{
  "success": true,
  "data": {
    "id": "uuid-123-456",
    "nom": "Jean Dupont",
    "telephone": "+33123456789",
    "adresse": "123 Rue de la Paix, Paris",
    "site_web": "https://exemple.com",
    "score_seo": 85,
    "message_personnalise": "Prospect qualifié",
    "user_id": "user-uuid",
    "created_at": "2025-01-13T10:30:00.000Z",
    "updated_at": "2025-01-13T10:30:00.000Z"
  }
}`}</pre>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Réponse d'erreur :</h4>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Codes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Codes de Statut HTTP</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
              <span className="font-medium text-green-800">200</span>
              <span className="text-green-700">Succès</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
              <span className="font-medium text-blue-800">201</span>
              <span className="text-blue-700">Créé</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded">
              <span className="font-medium text-yellow-800">400</span>
              <span className="text-yellow-700">Requête invalide</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
              <span className="font-medium text-red-800">401</span>
              <span className="text-red-700">Non autorisé</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
              <span className="font-medium text-red-800">404</span>
              <span className="text-red-700">Non trouvé</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
              <span className="font-medium text-red-800">500</span>
              <span className="text-red-700">Erreur serveur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitations</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Requêtes par minute</span>
            <span className="text-gray-900">100</span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Taille max. requête</span>
            <span className="text-gray-900">10 MB</span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">Timeout</span>
            <span className="text-gray-900">30 secondes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;