import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface ProspectFormProps {
  prospect?: any;
  onClose: () => void;
  onSave: () => void;
}

const ProspectForm: React.FC<ProspectFormProps> = ({ prospect, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    adresse: '',
    site_web: '',
    score_seo: '',
    message_personnalise: '',
    email: '', // Ajouté
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prospect) {
      setFormData({
        nom: prospect.nom || '',
        telephone: prospect.telephone || '',
        adresse: prospect.adresse || '',
        site_web: prospect.site_web || '',
        score_seo: prospect.score_seo?.toString() || '',
        message_personnalise: prospect.message_personnalise || '',
        email: prospect.email || '', // Ajouté
      });
    }
  }, [prospect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const prospectData = {
        nom: formData.nom,
        telephone: formData.telephone || null,
        adresse: formData.adresse || null,
        site_web: formData.site_web || null,
        score_seo: formData.score_seo ? parseInt(formData.score_seo) : null,
        message_personnalise: formData.message_personnalise || null,
        email: formData.email || null, // Ajouté
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (prospect) {
        // Update existing prospect
        const { error } = await supabase
          .from('prospects')
          .update(prospectData)
          .eq('id', prospect.id);

        if (error) throw error;
      } else {
        // Create new prospect
        const { error } = await supabase
          .from('prospects')
          .insert({
            ...prospectData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {prospect ? 'Modifier le Prospect' : 'Nouveau Prospect'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Web
                </label>
                <input
                  type="url"
                  value={formData.site_web}
                  onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score SEO (0-100)
                </label>
                <input
                  type="number"
                  value={formData.score_seo}
                  onChange={(e) => setFormData({ ...formData, score_seo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  placeholder="Ex: 85"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Personnalisé
              </label>
              <textarea
                value={formData.message_personnalise}
                onChange={(e) => setFormData({ ...formData, message_personnalise: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Message personnalisé pour ce prospect..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Email du prospect"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </div>
                ) : (
                  prospect ? 'Mettre à jour' : 'Créer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProspectForm;