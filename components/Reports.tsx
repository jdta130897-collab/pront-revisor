'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText } from 'lucide-react';
import { Advance, ThesisPattern } from '@/types';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface ReportsProps {
  advances: Advance[];
  pattern: ThesisPattern;
}

export default function Reports({ advances, pattern }: ReportsProps) {
  const approved = advances.filter(a => a.status === 'aprobado').length;
  const rejected = advances.filter(a => a.status === 'rechazado').length;
  const observed = advances.filter(a => a.status === 'observado').length;

  const programData = [
    { name: 'Maestría Educación', count: advances.length, avg: 81 },
    { name: 'Maestría Ingeniería', count: 12, avg: 76 },
    { name: 'Maestría Derecho', count: 8, avg: 84 },
  ];

  const generateConsolidatedReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("REPORTE CONSOLIDADO DE GESTIÓN", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} • PRONT Revisor`, 105, 28, { align: 'center' });

    doc.text(`Total de avances: ${advances.length}`, 20, 45);
    doc.text(`Aprobados: ${approved} (${Math.round(approved/advances.length*100)}%)`, 20, 53);
    doc.text(`Promedio general IA: ${Math.round(advances.reduce((s,a)=>s+(a.iaScore||0),0)/advances.length)}%`, 20, 61);

    doc.save("Reporte_Gestion_PRONT.pdf");
    toast.success("Reporte descargado");
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-4xl font-bold tracking-tight">Reportes y Estadísticas</div>
          <div className="text-muted-foreground">Análisis de productividad y efectividad del sistema</div>
        </div>
        <button 
          onClick={generateConsolidatedReport}
          className="flex items-center gap-2 px-6 py-3 border border-border rounded-2xl hover:bg-muted text-sm"
        >
          <Download className="w-4 h-4" /> Exportar Reporte PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-8">
          <div className="font-semibold mb-6">Distribución por Programa</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-8">
          <div className="font-semibold mb-6">Efectividad de la IA</div>
          <div className="flex justify-center items-center h-80">
            <div className="text-center">
              <div className="text-[120px] font-bold tabular-nums tracking-tighter text-primary">87</div>
              <div className="text-2xl -mt-6 text-muted-foreground">Concordancia IA-Humano</div>
              <div className="text-xs mt-4 max-w-[260px] mx-auto text-muted-foreground">El 87% de las notas de IA coinciden con la evaluación humana (±0.3 puntos)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-8">
        <div className="font-semibold mb-6">Actividad por Mes</div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { month: 'Enero', subidos: 14, revisados: 12 },
              { month: 'Febrero', subidos: 19, revisados: 17 },
              { month: 'Marzo', subidos: 22, revisados: 21 },
              { month: 'Abril', subidos: 28, revisados: 24 },
              { month: 'Mayo', subidos: 31, revisados: 19 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="subidos" fill="#a855f7" radius={4} name="Avances subidos" />
              <Bar dataKey="revisados" fill="#22c55e" radius={4} name="Revisados" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
