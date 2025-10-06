import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import ProspectForm from './ProspectForm';

interface Prospect {
  id: string;
  nom: string;
  telephone: string | null;
  adresse: string | null;
  site_web: string | null;
  score_seo: number | null;
  message_personnalise: string | null;
  created_at: string;
  updated_at: string;
  user_id: string; // Ajouté pour audit SEO
  email: string | null; // Ajouté
}

const ProspectManager = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResponse, setEmailResponse] = useState<string | null>(null);
  const [rapportMarkdown, setRapportMarkdown] = useState<string | null>(null);
  const [loadingRapport, setLoadingRapport] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResponse, setAuditResponse] = useState<string | null>(null);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProspect = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) return;

    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProspects(prospects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting prospect:', error);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prospect.telephone && prospect.telephone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prospect.adresse && prospect.adresse.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prospect.site_web && prospect.site_web.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Ajout de la recherche dans le message personnalisé
      (prospect.message_personnalise && prospect.message_personnalise.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleSendProspectionEmailSingle = async (prospect: Prospect) => {
    setSendingEmail(true);
    setEmailResponse(null);
    try {
      // Récupérer les infos enrichies du prospect
      const { data: enrichies } = await supabase
        .from('informations_enrichies')
        .select('*')
        .eq('id_prospect', prospect.id);
      const payload = [{
        ...prospect,
        enrichies: enrichies || []
      }];
      const params = new URLSearchParams({
        prospects: JSON.stringify(payload)
      });
      const res = await fetch(`http://localhost:5678/webhook/1df91b44-a347-4ccc-b1b0-887fb8d72917?${params.toString()}`);
      const data = await res.json();
      setEmailResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setEmailResponse('Erreur lors de l’envoi de l’email de prospection');
    }
    setSendingEmail(false);
  };

  useEffect(() => {
    if (selectedProspect) {
      setLoadingRapport(true);
      supabase
        .from('informations_enrichies')
        .select('rapport_markdown')
        .eq('id_prospect', selectedProspect.id)
        .then(({ data }) => {
          setRapportMarkdown(data && data.length > 0 ? data[0].rapport_markdown : null);
          setLoadingRapport(false);
        });
    } else {
      setRapportMarkdown(null);
    }
  }, [selectedProspect]);

  const handleGenerateAuditSEO = async (prospect: Prospect) => {
    setAuditLoading(true);
    setAuditResponse(null);
    try {
      const params = new URLSearchParams({
        prospect_id: prospect.id,
        user_id: prospect.user_id || '',
        site_web: prospect.site_web || ''
      });
      const res = await fetch(`http://localhost:5678/webhook/f5d1cbd7-48eb-4479-82c6-b424d7f98e5a?${params.toString()}`);
      const data = await res.json();
      setAuditResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setAuditResponse('Erreur lors de la génération de l’audit SEO');
    }
    setAuditLoading(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (selectedProspect) {
      interval = setInterval(async () => {
        // Recharger le prospect depuis Supabase
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .eq('id', selectedProspect.id)
          .single();
        if (data && !error) {
          setSelectedProspect(data);
        }
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedProspect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Prospects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Prospect</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, adresse, site web, ou message personnalisé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Web
                </th>
                {/* NOUVELLE COLONNE DANS LE HEADER */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message Personnalisé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score SEO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{prospect.nom}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{prospect.telephone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prospect.site_web ? (
                      <a href={prospect.site_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {prospect.site_web}
                      </a>
                    ) : '-'}
                  </td>
                    {/* NOUVELLE CELLULE DU TABLEAU */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="truncate max-w-xs block">
                        {prospect.message_personnalise || '—'}
                    </span>
                  </td>
                    {/* FIN NOUVELLE CELLULE DU TABLEAU */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prospect.score_seo !== null ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prospect.score_seo >= 80 ? 'bg-green-100 text-green-800' :
                        prospect.score_seo >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {prospect.score_seo}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prospect.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedProspect(prospect)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProspect(prospect);
                          setShowForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProspect(prospect.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProspects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun prospect trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Prospect Form Modal */}
      {showForm && (
        <ProspectForm
          prospect={editingProspect}
          onClose={() => {
            setShowForm(false);
            setEditingProspect(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingProspect(null);
            loadProspects();
          }}
        />
      )}

      {/* Prospect Details Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Détails du Prospect</h2>
                <button
                  onClick={() => setSelectedProspect(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <p className="text-gray-900">{selectedProspect.nom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <p className="text-gray-900">{selectedProspect.telephone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedProspect.email || <span className="text-gray-400">(aucun email renseigné)</span>}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <p className="text-gray-900">{selectedProspect.adresse || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Web</label>
                    <p className="text-gray-900">
                      {selectedProspect.site_web ? (
                        <a href={selectedProspect.site_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {selectedProspect.site_web}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Score SEO</label>
                  <p className="text-gray-900">
                    {selectedProspect.score_seo !== null ? `${selectedProspect.score_seo}/100` : '-'}
                  </p>
                </div>
                
                {/* Affichage du Message Personnalisé dans la modale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message Personnalisé</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {selectedProspect.message_personnalise || 'Aucun message.'}
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Créé le</label>
                    <p className="text-gray-900">
                      {new Date(selectedProspect.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modifié le</label>
                    <p className="text-gray-900">
                      {new Date(selectedProspect.updated_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rapport Markdown</label>
                  {loadingRapport ? (
                    <div>Chargement du rapport...</div>
                  ) : rapportMarkdown ? (
                    <pre className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap text-xs max-h-48 overflow-auto">{rapportMarkdown}</pre>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <span className="text-red-600">Aucun rapport markdown disponible pour ce prospect.</span>
                      <button
                        onClick={() => handleGenerateAuditSEO(selectedProspect)}
                        className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                        disabled={auditLoading}
                      >
                        {auditLoading ? 'Génération...' : 'Générer un audit SEO'}
                      </button>
                      {auditResponse && (
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">{auditResponse}</pre>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => handleSendProspectionEmailSingle(selectedProspect)}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    disabled={sendingEmail || !rapportMarkdown || !selectedProspect.email}
                  >
                    {sendingEmail ? 'Envoi...' : 'Envoyer un email de prospection'}
                  </button>
                  {(!rapportMarkdown || !selectedProspect.email) && (
                    <span className="ml-4 text-sm text-red-600">
                      {!rapportMarkdown && "Impossible d'envoyer un email sans rapport markdown."}
                      {!selectedProspect.email && "Impossible d'envoyer un email sans adresse email. "}
                      {!selectedProspect.email && (
                        <button
                          onClick={() => {
                            setEditingProspect(selectedProspect);
                            setShowForm(true);
                            setSelectedProspect(null);
                          }}
                          className="ml-2 px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-xs"
                        >Ajouter un email</button>
                      )}
                    </span>
                  )}
                </div>
                {emailResponse && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Réponse du workflow N8N :</label>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64">{emailResponse}</pre>
                  </div>
                )}
                {/* ...autres champs... */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectManager;