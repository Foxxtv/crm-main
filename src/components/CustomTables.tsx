import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Database, Edit, Trash2, Code } from 'lucide-react';

interface CustomTable {
  id: string;
  name: string;
  schema: any;
  created_at: string;
  updated_at: string;
}

const CustomTables = () => {
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<CustomTable | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [{ name: '', type: 'text', required: false }],
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('custom_tables')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const schema = {
        description: formData.description,
        fields: formData.fields,
      };

      const tableData = {
        name: formData.name,
        schema,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingTable) {
        const { error } = await supabase
          .from('custom_tables')
          .update(tableData)
          .eq('id', editingTable.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_tables')
          .insert({
            ...tableData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setShowForm(false);
      setEditingTable(null);
      resetForm();
      loadTables();
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return;

    try {
      const { error } = await supabase
        .from('custom_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTables(tables.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fields: [{ name: '', type: 'text', required: false }],
    });
  };

  const editTable = (table: CustomTable) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      description: table.schema.description || '',
      fields: table.schema.fields || [{ name: '', type: 'text', required: false }],
    });
    setShowForm(true);
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', type: 'text', required: false }],
    });
  };

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    });
  };

  const updateField = (index: number, field: any) => {
    const newFields = [...formData.fields];
    newFields[index] = field;
    setFormData({ ...formData, fields: newFields });
  };

  const fieldTypes = [
    { value: 'text', label: 'Texte' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Oui/Non' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'select', label: 'Liste déroulante' },
  ];

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables Personnalisées</h1>
          <p className="text-gray-600 mt-1">
            Créez des structures de données personnalisées pour organiser vos informations
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Table</span>
        </button>
      </div>

      {/* API Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Code className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">API Endpoints</h3>
            <p className="text-blue-800 text-sm mb-3">
              Vos tables personnalisées sont automatiquement accessibles via l'API REST :
            </p>
            <div className="bg-white rounded-lg p-3 font-mono text-sm">
              <div className="text-blue-600">GET /api/tables/[nom_table] - Lister les enregistrements</div>
              <div className="text-green-600">POST /api/tables/[nom_table] - Créer un enregistrement</div>
              <div className="text-orange-600">PUT /api/tables/[nom_table]/[id] - Modifier un enregistrement</div>
              <div className="text-red-600">DELETE /api/tables/[nom_table]/[id] - Supprimer un enregistrement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{table.name}</h3>
                  <p className="text-sm text-gray-500">
                    {table.schema.fields?.length || 0} champs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => editTable(table)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {table.schema.description || 'Aucune description'}
              </p>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">Champs :</p>
                {table.schema.fields?.slice(0, 3).map((field: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{field.name}</span>
                    <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {field.type}
                    </span>
                  </div>
                ))}
                {table.schema.fields?.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{table.schema.fields.length - 3} autres champs
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Créée le</span>
                <span>{new Date(table.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucune table personnalisée</p>
            <p className="text-sm text-gray-400">
              Créez votre première table pour commencer à organiser vos données
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTable ? 'Modifier la Table' : 'Nouvelle Table'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTable(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveTable} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la table *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Ex: clients, projets, factures..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description de la table"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Champs de la table *
                    </label>
                    <button
                      type="button"
                      onClick={addField}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter un champ</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                            placeholder="Nom du champ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">Obligatoire</label>
                        </div>
                        
                        <div className="flex justify-end">
                          {formData.fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTable(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingTable ? 'Mettre à jour' : 'Créer la table'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTables;