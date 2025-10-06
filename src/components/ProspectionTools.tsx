import React, { useState } from 'react';
import { Bot, Mail, Search, FileText, Users, Zap, Play, Settings, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ProspectionTools = () => {
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [googleQuery, setGoogleQuery] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [n8nResponse, setN8nResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSeoAuditForm, setShowSeoAuditForm] = useState(false);
   const [showEmailCampaignForm, setShowEmailCampaignForm] = useState(false);
  const [prospects, setProspects] = useState<{id: string, nom: string, site_web?: string}[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState('');
  const [selectedProspectSite, setSelectedProspectSite] = useState('');
  const [seoAuditResponse, setSeoAuditResponse] = useState<string | null>(null);
  const [loadingSeo, setLoadingSeo] = useState(false);
  const [userId, setUserId] = useState('');
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [emailResponse, setEmailResponse] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<{id: string, email?: string}[]>([]);

  React.useEffect(() => {
    // Récupérer la liste des utilisateurs via Supabase admin
    // @ts-ignore
    supabase.auth.admin.listUsers().then(({ data, error }) => {
      if (error) return;
      if (data?.users) {
        setUsers(data.users.filter((u: { email?: string }) => !!u.email).map((u: { id: string; email?: string }) => ({ id: u.id, email: u.email })));
      }
    });
    supabase.from('prospects').select('id, nom, site_web').then(({ data }) => setProspects(data || []));
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id);
    });
  }, []);

  React.useEffect(() => {
    const prospect = prospects.find(p => p.id === selectedProspectId);
    setSelectedProspectSite(prospect?.site_web || '');
  }, [selectedProspectId, prospects]);

  const tools = [
    {
      id: 'generate-prospects',
      title: 'Générer des Prospects',
      description: 'Automatiser la recherche et génération de prospects qualifiés selon vos critères',
      icon: Users,
      color: 'bg-blue-500',
      features: [
        'Recherche par secteur d\'activité',
        'Filtrage géographique',
        'Validation des données',
        'Export automatique'
      ],
      status: 'active'
    },
    {
      id: 'email-campaigns',
      title: 'Campagnes Email',
      description: 'Envoyer des emails de prospection personnalisés et automatisés',
      icon: Mail,
      color: 'bg-green-500',
      features: [
        'Templates personnalisables',
        'Envoi séquentiel',
        'Suivi des ouvertures',
        'Gestion des réponses'
      ],
      status: 'active'
    },
    {
      id: 'seo-audit',
      title: 'Audit SEO Automatique',
      description: 'Générer des audits SEO complets pour vos prospects',
      icon: Search,
      color: 'bg-purple-500',
      features: [
        'Analyse technique complète',
        'Score SEO détaillé',
        'Recommandations personnalisées',
        'Rapport PDF automatique'
      ],
      status: 'active'
    },
    {
      id: 'lead-scoring',
      title: 'Scoring de Prospects',
      description: 'Évaluer et classer automatiquement vos prospects',
      icon: FileText,
      color: 'bg-orange-500',
      features: [
        'Critères personnalisables',
        'Score en temps réel',
        'Priorisation automatique',
        'Alertes qualifiées'
      ],
      status: 'coming-soon'
    },
    {
      id: 'social-research',
      title: 'Recherche Sociale',
      description: 'Enrichir les profils prospects via les réseaux sociaux',
      icon: Bot,
      color: 'bg-pink-500',
      features: [
        'LinkedIn scraping',
        'Analyse des profils',
        'Détection des décideurs',
        'Enrichissement automatique'
      ],
      status: 'coming-soon'
    },
    {
      id: 'workflow-automation',
      title: 'Automatisation Avancée',
      description: 'Créer des workflows personnalisés pour votre prospection',
      icon: Zap,
      color: 'bg-indigo-500',
      features: [
        'Workflows visuels',
        'Conditions logiques',
        'Intégrations multiples',
        'Déclencheurs automatiques'
      ],
      status: 'beta'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Actif</span>;
      case 'beta':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Bêta</span>;
      case 'coming-soon':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Bientôt</span>;
      default:
        return null;
    }
  };

  const handleProspectWorkflow = async () => {
    setLoading(true);
    setN8nResponse(null);
    try {
      const params = new URLSearchParams({ query: googleQuery, localisation, user_id: selectedUserId });
      const res = await fetch(`http://localhost:5678/webhook/594ef261-64fa-4011-a418-872e827d9f38?${params.toString()}`);
      const data = await res.json();
      setN8nResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setN8nResponse('Erreur lors de l’appel au workflow N8N');
    }
    setLoading(false);
  };

  const handleSeoAuditWorkflow = async () => {
    setLoadingSeo(true);
    setSeoAuditResponse(null);
    try {
      const params = new URLSearchParams({ prospect_id: selectedProspectId, user_id: userId, site_web: selectedProspectSite });
      const res = await fetch(`http://localhost:5678/webhook-test/f5d1cbd7-48eb-4479-82c6-b424d7f98e5a?${params.toString()}`);
      const data = await res.json();
      setSeoAuditResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setSeoAuditResponse('Erreur lors de l’appel au workflow N8N');
    }
    setLoadingSeo(false);
  };

  const handleProspectSelect = (id: string) => {
    setSelectedProspectIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleSendProspectionEmail = async () => {
    setLoadingEmail(true);
    setEmailResponse(null);
    try {
      // Récupérer toutes les infos prospects et enrichies
      const selectedProspects = prospects.filter(p => selectedProspectIds.includes(p.id));
      const { data: enrichies } = await supabase
        .from('informations_enrichies')
        .select('*')
        .in('id_prospect', selectedProspectIds);
      // Préparer les données à transmettre
      const payload = selectedProspects.map(p => ({
        ...p,
        enrichies: enrichies?.filter(e => e.id_prospect === p.id) || []
      }));
      const params = new URLSearchParams({
        prospects: JSON.stringify(payload)
      });
      const res = await fetch(`http://localhost:5678/webhook/1df91b44-a347-4ccc-b1b0-887fb8d72917?${params.toString()}`);
      const data = await res.json();
      setEmailResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setEmailResponse('Erreur lors de l’envoi de l’email de prospection');
    }
    setLoadingEmail(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outils de Prospection</h1>
          <p className="text-gray-600 mt-1">
            Automatisez votre prospection avec des workflows N8N intelligents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span>N8N Dashboard</span>
          </button>
        </div>
      </div>

      {/* N8N Integration Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Intégration N8N Active</h3>
            <p className="text-blue-800 text-sm mb-3">
              Vos workflows d'automatisation sont connectés et opérationnels. 
              Surveillez l'exécution en temps réel et optimisez vos processus.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-blue-700">Connecté</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-700">Dernière sync: il y a 2 min</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-700">6 workflows actifs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                  {getStatusBadge(tool.status)}
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{tool.description}</p>

            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider">Fonctionnalités</h4>
              <ul className="space-y-1">
                {tool.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              {tool.id === 'generate-prospects' ? (
                <button
                  onClick={() => setShowProspectForm(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Lancer</span>
                </button>
              ) : tool.id === 'seo-audit' ? (
                <button
                  onClick={() => setShowSeoAuditForm(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Lancer</span>
                </button>
              ) : tool.id === 'email-campaigns' ? (
                <button
                  onClick={() => setShowEmailCampaignForm(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Lancer</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span>Lancer</span>
                </button>
              )}
              <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal pour le workflow Générer des Prospects */}
      {showProspectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Générer des Prospects</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sélectionner un utilisateur</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                >
                  <option value="">-- Sélectionner --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requête métier Google</label>
                <input
                  type="text"
                  value={googleQuery}
                  onChange={e => setGoogleQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ex: agence marketing digital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Localisation</label>
                <input
                  type="text"
                  value={localisation}
                  onChange={e => setLocalisation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ex: Paris"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowProspectForm(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >Annuler</button>
                <button
                  onClick={handleProspectWorkflow}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading || !googleQuery || !localisation}
                >{loading ? 'Chargement...' : 'Envoyer'}</button>
              </div>
              {n8nResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Réponse du workflow N8N :</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">{n8nResponse}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal pour le workflow Audit SEO Automatique */}
      {showSeoAuditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Audit SEO Automatique</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prospect à auditer</label>
                <select
                  value={selectedProspectId}
                  onChange={e => setSelectedProspectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Sélectionner --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSeoAuditForm(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >Annuler</button>
                <button
                  onClick={handleSeoAuditWorkflow}
                  className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                  disabled={loadingSeo || !selectedProspectId}
                >{loadingSeo ? 'Chargement...' : 'Envoyer'}</button>
              </div>
              {seoAuditResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Réponse du workflow N8N :</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">{seoAuditResponse}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal pour le workflow Campagne Email */}
      {showEmailCampaignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Campagne Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rechercher un prospect</label>
                <input
                  type="text"
                  placeholder="Nom du prospect..."
                  onChange={e => {
                    const search = e.target.value.toLowerCase();
                    setProspects(prev => prev.filter(p => p.nom.toLowerCase().includes(search)));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                />
                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {prospects.map(p => (
                    <label key={p.id} className="flex items-center px-3 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProspectIds.includes(p.id)}
                        onChange={() => handleProspectSelect(p.id)}
                        className="mr-2"
                      />
                      {p.nom}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Choisir un template d'email à envoyer</label>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleSendProspectionEmail}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    disabled={loadingEmail || selectedProspectIds.length === 0}
                  >{loadingEmail ? 'Envoi...' : 'Email de prospection'}</button>
                  <button
                    disabled
                    className="px-4 py-2 rounded bg-gray-300 text-gray-600 cursor-not-allowed"
                  >Email de Suivi de prospection (bientôt)</button>
                  <button
                    disabled
                    className="px-4 py-2 rounded bg-gray-300 text-gray-600 cursor-not-allowed"
                  >Email de devis (bientôt)</button>
                </div>
              </div>
              {emailResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Réponse du workflow N8N :</label>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">{emailResponse}</pre>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEmailCampaignForm(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectionTools;