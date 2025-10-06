import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, DollarSign, Target, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface DashboardStats {
  totalProspects: number;
  convertedProspects: number;
  totalValue: number;
  conversionRate: number;
  recentProspects: any[];
  statusCounts: { [key: string]: number };
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProspects: 0,
    convertedProspects: 0,
    totalValue: 0,
    conversionRate: 0,
    recentProspects: [],
    statusCounts: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all prospects
      const { data: prospects } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', user.id);

      if (prospects) {
        const totalProspects = prospects.length;
        const prospectsWithSEO = prospects.filter(p => p.score_seo !== null).length;
        const averageSEOScore = prospects.length > 0 
          ? prospects.reduce((sum, p) => sum + (p.score_seo || 0), 0) / prospects.filter(p => p.score_seo !== null).length || 0
          : 0;
        const highSEOProspects = prospects.filter(p => p.score_seo && p.score_seo >= 80).length;

        // Get recent prospects
        const recentProspects = prospects
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setStats({
          totalProspects,
          convertedProspects: prospectsWithSEO,
          totalValue: averageSEOScore,
          conversionRate: highSEOProspects,
          recentProspects,
          statusCounts: {},
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Prospects',
      value: stats.totalProspects,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Score SEO Moyen',
      value: `${stats.totalValue.toFixed(0)}/100`,
      icon: Target,
      color: 'bg-green-500',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Avec Score SEO',
      value: stats.convertedProspects,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: '+23%',
      trendUp: true,
    },
    {
      title: 'Score SEO ≥ 80',
      value: stats.conversionRate,
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: '+8%',
      trendUp: true,
    },
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Mis à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="flex items-center mt-2">
                  {card.trendUp ? (
                    <ArrowUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ml-1 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend}
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Prospects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prospects Récents</h2>
       <div className="space-y-3">
         {stats.recentProspects.map((prospect) => (
           <div key={prospect.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
             <div className="flex items-center space-x-3 w-1/3"> {/* W-1/3 pour le nom/téléphone */}
               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                 <span className="text-sm font-medium text-blue-600">
                   {prospect.nom.charAt(0).toUpperCase()}
                 </span>
               </div>
               <div>
                 <p className="font-medium text-gray-900">{prospect.nom}</p>
                 <p className="text-sm text-gray-500">{prospect.telephone || 'Pas de téléphone'}</p>
               </div>
             </div>

             {/* NOUVELLE COLONNE : Message Personnalisé */}
             <div className="flex-1 px-4 truncate">
               <p className="text-sm text-gray-700">
                 <strong className="text-gray-500 mr-2">Message:</strong>
                 {prospect.message_personnalise || '—'}
               </p>
             </div>

             <div className="text-right">
               {prospect.score_seo !== null ? (
                 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                   prospect.score_seo >= 80 ? 'bg-green-100 text-green-800' :
                   prospect.score_seo >= 60 ? 'bg-yellow-100 text-yellow-800' :
                   'bg-red-100 text-red-800'
                 }`}>
                   SEO: {prospect.score_seo}/100
                 </span>
               ) : (
                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                   Pas de score
                 </span>
               )}
               <p className="text-sm text-gray-500 mt-1">
                 {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
               </p>
             </div>
           </div>
         ))}
         {stats.recentProspects.length === 0 && (
           <p className="text-gray-500 text-center py-4">Aucun prospect récent</p>
         )}
       </div>
      </div>

        {/* SEO Score Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Scores SEO</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="font-medium text-gray-700">Excellent (80-100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{stats.conversionRate}</span>
                <span className="text-sm text-gray-500">
                  ({stats.totalProspects > 0 ? ((stats.conversionRate / stats.totalProspects) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="font-medium text-gray-700">Moyen (60-79)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {stats.recentProspects.filter(p => p.score_seo >= 60 && p.score_seo < 80).length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="font-medium text-gray-700">Faible (0-59)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {stats.recentProspects.filter(p => p.score_seo !== null && p.score_seo < 60).length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                <span className="font-medium text-gray-700">Non évalué</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {stats.totalProspects - stats.convertedProspects}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;