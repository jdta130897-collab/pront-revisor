'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Clock, Award, ArrowUp, ArrowDown, 
  FileText, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { Advance, User } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useTranslation } from '@/lib/i18n';

interface DashboardProps {
  user: User;
  advances: Advance[];
  kpis: {
    total?: number;
    pending: number;
    reviewed: number;
    approved: number;
    avgIaScore: number;
    avgFinalScore?: number;
    avgTime: string;
    recentAdvances?: any[];
    statusData?: any[];
    activityByMonth?: any[];
    hasData?: boolean;
  };
  onReview: (advance: Advance) => void;
  onUpload: () => void;
}

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b'];

export default function Dashboard({ user, advances, kpis, onReview, onUpload }: DashboardProps) {
  const { t, locale } = useTranslation();

  // 100% prefer real backend data when available
  const statusData = kpis.statusData && kpis.statusData.length > 0 
    ? kpis.statusData 
    : [
        { name: t('dashboard.kpi.pending'), value: kpis.pending, color: '#f59e0b' },
        { name: t('review.status.observado'), value: kpis.reviewed, color: '#3b82f6' },
        { name: t('dashboard.kpi.approved'), value: kpis.approved, color: '#22c55e' },
      ];

  const activityData = kpis.activityByMonth && kpis.activityByMonth.length > 0 
    ? kpis.activityByMonth 
    : []; // Will show empty or fallback if needed

  const displayRecent = kpis.recentAdvances && kpis.recentAdvances.length > 0 
    ? kpis.recentAdvances 
    : advances.slice(0, 5);

  // If parent passes real recent advances via kpis or we can enhance later
  // For now we use the advances prop which is now coming from real backend in most cases

  // statusData is now built above from real backend data when possible

  const scoreTrend = [
    { month: 'Ene', ia: 72, humano: 75 },
    { month: 'Feb', ia: 78, humano: 81 },
    { month: 'Mar', ia: 81, humano: 84 },
    { month: 'Abr', ia: 85, humano: 88 },
    { month: 'May', ia: kpis.avgIaScore, humano: 87 },
  ];

  // displayRecent is already defined above from backend data when available

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: t('dashboard.kpi.pending'), 
            value: kpis.pending, 
            icon: Clock, 
            color: "amber", 
            change: "+3 esta semana",
            trend: "up"
          },
          { 
            label: t('dashboard.kpi.avgScore'), 
            value: `${kpis.avgIaScore}%`, 
            icon: Award, 
            color: "blue", 
            change: "+4.2% vs mes anterior",
            trend: "up"
          },
          { 
            label: t('dashboard.kpi.avgTime'), 
            value: kpis.avgTime, 
            icon: TrendingUp, 
            color: "violet", 
            change: "-18% más rápido",
            trend: "down"
          },
          { 
            label: t('dashboard.kpi.approved'), 
            value: `${Math.round((kpis.approved / Math.max(1, (kpis.total || advances.length))) * 100)}%`, 
            icon: CheckCircle, 
            color: "emerald", 
            change: "Estable",
            trend: "up"
          },
        ].map((kpi, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass rounded-3xl p-8 card-hover group"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-muted-foreground mb-1">{kpi.label}</div>
                <div className="text-5xl font-bold tracking-tighter metric-value">{kpi.value}</div>
              </div>
              <div className={`p-4 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-500 group-hover:scale-110 transition-transform`}>
                <kpi.icon className="w-7 h-7" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-6 text-xs">
              {kpi.trend === 'up' ? (
                <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className="text-muted-foreground">{kpi.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-2 glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="font-semibold text-xl">{t('dashboard.distribution')}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.last30Days')}</div>
            </div>
            <div className="text-xs px-4 py-1 bg-muted rounded-full">{t('dashboard.realTime')}</div>
          </div>
          
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={118}
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-8 mt-4">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="font-mono text-muted-foreground">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Evolution */}
        <div className="lg:col-span-3 glass rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="font-semibold text-xl">{t('dashboard.scoreEvolution')}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.comparison')}</div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-px bg-blue-500" /> {t('dashboard.iaGrok')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-px bg-purple-500" /> {t('dashboard.human')}</div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }} 
                />
                <Line 
                  type="natural" 
                  dataKey="ia" 
                  stroke="#3b82f6" 
                  strokeWidth={3.5} 
                  dot={{ fill: '#3b82f6', r: 5 }} 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="natural" 
                  dataKey="humano" 
                  stroke="#a855f7" 
                  strokeWidth={3.5} 
                  strokeDasharray="4 2"
                  dot={{ fill: '#a855f7', r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border flex items-center justify-between">
          <div className="font-semibold text-xl">Actividad Reciente</div>
          <button 
            onClick={() => window.location.reload()} // demo
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver todo <ArrowUp className="rotate-45 w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                <th className="text-left py-4 px-8 font-normal">Estudiante / Avance</th>
                <th className="text-left py-4 px-4 font-normal">Versión</th>
                <th className="text-left py-4 px-4 font-normal">Estado</th>
                <th className="text-left py-4 px-4 font-normal">Puntaje IA</th>
                <th className="text-left py-4 px-4 font-normal">Fecha</th>
                <th className="text-right py-4 px-8 font-normal">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayRecent.length > 0 ? displayRecent.map((adv, index) => (
                <motion.tr 
                  key={adv.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-muted/40 group cursor-pointer"
                  onClick={() => onReview(adv)}
                >
                  <td className="py-5 px-8">
                    <div className="font-medium">{adv.studentName}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1 max-w-[420px]">{adv.title}</div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-mono">v{adv.version}</div>
                  </td>
                  <td className="py-5 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium
                      ${adv.status === 'aprobado' ? 'bg-emerald-500/10 text-emerald-600' : ''}
                      ${adv.status === 'en_revision' ? 'bg-blue-500/10 text-blue-600' : ''}
                      ${adv.status === 'pendiente' ? 'bg-amber-500/10 text-amber-600' : ''}
                      ${adv.status === 'rechazado' ? 'bg-rose-500/10 text-rose-600' : ''}
                    `}>
                      {adv.status === 'aprobado' && <CheckCircle className="w-3.5 h-3.5" />}
                      {adv.status === 'en_revision' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {adv.status === 'pendiente' && <Clock className="w-3.5 h-3.5" />}
                      {adv.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xl font-semibold tabular-nums">{adv.iaScore || '—'}</div>
                      {adv.iaScore > 0 && <div className="text-xs text-muted-foreground">/100</div>}
                    </div>
                  </td>
                  <td className="py-5 px-4 text-sm text-muted-foreground">
                    {format(new Date(adv.uploadDate), "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="py-5 px-8 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onReview(adv); }}
                      className="opacity-0 group-hover:opacity-100 transition-all px-6 py-2 text-xs font-medium border border-border hover:bg-primary hover:text-white rounded-2xl"
                    >
                      {adv.iaScore > 0 ? 'Ver Revisión' : 'Analizar ahora'}
                    </button>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    No hay avances recientes. ¡Sube el primero!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
