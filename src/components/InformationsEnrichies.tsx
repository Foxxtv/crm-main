import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';

interface InfoEnrichie {
  id: number;
  id_prospect: string;
  rapport_markdown: string;
  audit_seo: any;
  created_at: string;
  prospects?: { id: string; nom: string; user_id: string };
}

const InformationsEnrichies = () => {
  const [infos, setInfos] = useState<InfoEnrichie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInfo, setEditingInfo] = useState<InfoEnrichie | null>(null);
  const [prospects, setProspects] = useState<{id: string, nom: string}[]>([]);
  const [form, setForm] = useState({ id_prospect: '', rapport_markdown: '', audit_seo: '{}' });
  const [editForm, setEditForm] = useState({ id: 0, id_prospect: '', rapport_markdown: '', audit_seo: '{}' });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('informations_enrichies')
      .select('*, prospects:prospects(id, nom, user_id)')
      .then((response) => setInfos(response.data ?? []));
    supabase.from('prospects').select('id, nom').then((response) => setProspects(response.data ?? []));
  }, []);

  useEffect(() => {
    if (editingInfo) {
      setEditForm({
        id: editingInfo.id,
        id_prospect: editingInfo.id_prospect,
        rapport_markdown: editingInfo.rapport_markdown,
        audit_seo: JSON.stringify(editingInfo.audit_seo, null, 2),
      });
    }
  }, [editingInfo]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  const loadInfos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('informations_enrichies')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setInfos(data || []);
    setLoading(false);
  };

  const deleteInfo = async (id: number) => {
    if (!confirm('Supprimer cette information enrichie ?')) return;
    await supabase.from('informations_enrichies').delete().eq('id', id);
    setInfos(infos.filter(i => i.id !== id));
  };

  const filteredInfos = infos.filter((info: InfoEnrichie) => {
    if (!userId) return false;
    return (
      info.prospects && info.prospects.user_id === userId && (
        info.id_prospect?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        info.rapport_markdown?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(info.audit_seo)?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Informations Enrichies</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Information</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par prospect, rapport, audit seo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Prospect</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rapport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit SEO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInfos.map(info => (
                <tr key={info.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{info.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{info.prospects?.nom || info.id_prospect}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <pre className="bg-gray-50 p-2 rounded text-xs max-w-xs overflow-x-auto">{info.rapport_markdown}</pre>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <pre className="bg-gray-50 p-2 rounded text-xs max-w-xs overflow-x-auto">{JSON.stringify(info.audit_seo, null, 2)}</pre>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(info.created_at).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => setEditingInfo(info)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteInfo(info.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInfos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune information enrichie trouvée</p>
            </div>
          )}
        </div>
      </div>
      {/* Modal de création */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Nouvelle Information Enrichie</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prospect</label>
                <select
                  value={form.id_prospect}
                  onChange={e => setForm({ ...form, id_prospect: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">-- Sélectionner --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rapport (Markdown)</label>
                <textarea
                  value={form.rapport_markdown}
                  onChange={e => setForm({ ...form, rapport_markdown: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Audit SEO (JSON)</label>
                <textarea
                  value={form.audit_seo}
                  onChange={e => setForm({ ...form, audit_seo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >Annuler</button>
                <button
                  onClick={async () => {
                    if (!form.id_prospect) return alert('Sélectionnez un prospect');
                    let auditSeo;
                    try {
                      auditSeo = JSON.parse(form.audit_seo);
                    } catch {
                      return alert('Le champ JSON est invalide');
                    }
                    await supabase.from('informations_enrichies').insert({
                      id_prospect: form.id_prospect,
                      rapport_markdown: form.rapport_markdown,
                      audit_seo: auditSeo,
                    });
                    setShowForm(false);
                    setForm({ id_prospect: '', rapport_markdown: '', audit_seo: '{}' });
                    loadInfos();
                  }}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal d'édition */}
      {editingInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-bold mb-4">Modifier l'information enrichie</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prospect</label>
                <select
                  value={editForm.id_prospect}
                  onChange={e => setEditForm({ ...editForm, id_prospect: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  disabled
                >
                  <option value="">-- Sélectionner --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rapport (Markdown)</label>
                <textarea
                  value={editForm.rapport_markdown}
                  onChange={e => setEditForm({ ...editForm, rapport_markdown: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Audit SEO (JSON)</label>
                <textarea
                  value={editForm.audit_seo}
                  onChange={e => setEditForm({ ...editForm, audit_seo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingInfo(null)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >Annuler</button>
                <button
                  onClick={async () => {
                    let auditSeo;
                    try {
                      auditSeo = JSON.parse(editForm.audit_seo);
                    } catch {
                      return alert('Le champ JSON est invalide');
                    }
                    const { error } = await supabase.from('informations_enrichies').update({
                      rapport_markdown: editForm.rapport_markdown,
                      audit_seo: auditSeo,
                    }).eq('id', editForm.id);
                    if (error) {
                      alert('Erreur lors de la modification : ' + error.message);
                      return;
                    }
                    setEditingInfo(null);
                    loadInfos();
                  }}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InformationsEnrichies;
