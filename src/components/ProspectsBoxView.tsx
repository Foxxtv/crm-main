import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  user_id: string;
  email: string | null;
  status: string;
  notes?: string | null;
}

interface BoxViewProps {
  prospects: Prospect[];
  onView: (prospect: Prospect) => void;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
}

const ProspectsBoxView: React.FC<BoxViewProps> = ({ prospects, onView, onEdit, onDelete }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Vue Cartes des Prospects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prospects.map((prospect) => (
          <div key={prospect.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col space-y-3 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-gray-900">{prospect.nom}</div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                prospect.status === 'Nouveau' ? 'bg-gray-200 text-gray-700' :
                prospect.status === 'Refusé' ? 'bg-red-100 text-red-700' :
                prospect.status === 'Validé' ? 'bg-green-100 text-green-700' :
                prospect.status === 'Pas de réponse' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {prospect.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mb-1">{prospect.email || '-'}</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span>Tél: <span className="font-medium text-gray-800">{prospect.telephone || '-'}</span></span>
              <span>Site: {prospect.site_web ? <a href={prospect.site_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{prospect.site_web}</a> : '-'}</span>
            </div>
            <div className="text-xs text-gray-400">Créé le {new Date(prospect.created_at).toLocaleDateString('fr-FR')}</div>
            <div className="mt-2">
              <div className="font-semibold text-xs text-gray-500 mb-1">Message personnalisé</div>
              <div className="bg-gray-50 rounded p-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[32px]">{prospect.message_personnalise || 'Aucun message.'}</div>
            </div>
            <div>
              <div className="font-semibold text-xs text-gray-500 mb-1">Notes</div>
              <div className="bg-gray-50 rounded p-2 text-sm text-gray-800 whitespace-pre-wrap min-h-[32px]">{prospect.notes || 'Aucune note.'}</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">SEO: {prospect.score_seo !== null ? `${prospect.score_seo}/100` : '-'}</span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">Adresse: {prospect.adresse || '-'}</span>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => onView(prospect)} className="text-blue-600 hover:text-blue-900 p-1" title="Voir détails"><Eye className="w-4 h-4" /></button>
              <button onClick={() => onEdit(prospect)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Modifier"><Edit className="w-4 h-4" /></button>
              <button onClick={() => onDelete(prospect.id)} className="text-red-600 hover:text-red-900 p-1" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProspectsBoxView;
