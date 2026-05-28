'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock } from 'lucide-react';
import { Advance } from '@/types';
import { toast } from 'sonner';

interface BulkReviewProps {
  advances: Advance[];
  onProcessBatch: (selectedIds: string[]) => void;
  title?: string;
}

export default function BulkReview({ advances, onProcessBatch, title }: BulkReviewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(s => s !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === advances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(advances.map(a => a.id));
    }
  };

  const handleProcess = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos un avance');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    onProcessBatch(selectedIds);
    setSelectedIds([]);
    setIsProcessing(false);
  };

  return (
    <div className="glass rounded-3xl p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-3xl font-bold tracking-tight">
            {title || 'Revisión por Lotes'}
          </div>
          <div className="text-muted-foreground">
            {title 
              ? 'Procesa en lote los avances de tus estudiantes asignados' 
              : 'Procesa múltiples avances simultáneamente con Grok-IA'}
          </div>
        </div>
        
        <button 
          onClick={handleProcess}
          disabled={selectedIds.length === 0 || isProcessing}
          className="flex items-center gap-3 bg-primary disabled:bg-muted text-white px-9 py-4 rounded-2xl font-semibold disabled:cursor-not-allowed active:scale-[0.985]"
        >
          <Play className="w-5 h-5" />
          {isProcessing ? 'Procesando...' : `Procesar ${selectedIds.length} avances`}
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <button onClick={selectAll} className="text-primary hover:underline">
            {selectedIds.length === advances.length ? 'Deseleccionar todo' : 'Seleccionar todos'}
          </button>
          <div className="text-muted-foreground">• {selectedIds.length} seleccionados</div>
        </div>
        <div className="text-xs px-4 py-1 bg-muted rounded-full flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Tiempo estimado: ~{Math.ceil(selectedIds.length * 0.4)} min
        </div>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="w-12 p-4"></th>
              <th className="text-left p-4 font-normal">Estudiante</th>
              <th className="text-left p-4 font-normal">Título del Avance</th>
              <th className="text-left p-4 font-normal">Fecha</th>
              <th className="text-center p-4 font-normal">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {advances.length > 0 ? advances.map((adv) => (
              <tr 
                key={adv.id} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => toggleSelect(adv.id)}
              >
                <td className="p-4 pl-6">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(adv.id)} 
                    onChange={() => toggleSelect(adv.id)}
                    className="accent-primary w-5 h-5" 
                  />
                </td>
                <td className="p-4 font-medium">{adv.studentName}</td>
                <td className="p-4 text-muted-foreground line-clamp-1 max-w-[420px]">{adv.title}</td>
                <td className="p-4 text-muted-foreground text-xs">{new Date(adv.uploadDate).toLocaleDateString('es-ES')}</td>
                <td className="p-4 text-center">
                  <span className="inline-block px-4 py-px text-xs rounded-full bg-amber-500/10 text-amber-600">Pendiente de IA</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-16 text-center text-muted-foreground">
                  No hay avances pendientes de análisis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-xs text-center text-muted-foreground">
        El procesamiento se realiza en paralelo usando BullMQ + workers dedicados de Grok
      </div>
    </div>
  );
}
