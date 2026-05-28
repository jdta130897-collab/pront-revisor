'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Upload, FileText } from 'lucide-react';
import { ThesisPattern, PatternSection, User } from '@/types';
import { toast } from 'sonner';

interface PatternConfigProps {
  patterns: ThesisPattern[];
  currentUser: User;
  onUpdate: (pattern: ThesisPattern) => void;
  onCreateNew?: (pattern: ThesisPattern) => void;
}

export default function PatternConfig({ patterns, currentUser, onUpdate, onCreateNew }: PatternConfigProps) {
  const [localPatterns, setLocalPatterns] = useState<ThesisPattern[]>(patterns);
  const [selectedPatternId, setSelectedPatternId] = useState(patterns[0]?.id || '');
  const [newSectionName, setNewSectionName] = useState('');

  // Lista de especialidades/carreras de Ingeniería (enfocado en Ingeniería de Sistemas)
  const ACADEMIC_PROGRAMS = [
    "Ingeniería de Sistemas",
    "Ingeniería de Software",
    "Ingeniería Informática",
    "Ingeniería de Computación",
    "Ingeniería Electrónica",
    "Ingeniería de Telecomunicaciones",
    "Ingeniería Industrial",
    "Ingeniería Mecatrónica",
    "Ciencia de la Computación",
    "Ingeniería de Datos y Analítica",
    "Maestría en Ingeniería de Sistemas",
    "Maestría en Ingeniería de Software",
    "Maestría en Inteligencia Artificial",
    "Maestría en Ciberseguridad",
    "Doctorado en Ingeniería de Sistemas",
  ];

  const isAdvisor = currentUser.role === 'asesor';
  const canCreate = ['asesor', 'coordinador', 'admin'].includes(currentUser.role);

  const handleCreateNew = () => {
    if (!onCreateNew) return;

    const defaultProgram = ACADEMIC_PROGRAMS[0];

    const newPattern: ThesisPattern = {
      id: `pat-${Date.now()}`,
      name: `Mi Patrón - ${currentUser.name.split(' ')[0] || 'Asesor'}`,
      program: currentUser.program || defaultProgram,
      version: 'v1.0',
      sections: [
        { id: 'sec1', name: 'Introducción', required: true, minWords: 600, maxWords: 1200, weight: 15, description: 'Contexto, problema, objetivos e hipótesis' },
        { id: 'sec2', name: 'Marco Teórico', required: true, minWords: 1800, maxWords: 3500, weight: 25, description: 'Fundamentos teóricos y revisión de literatura' },
        { id: 'sec3', name: 'Metodología', required: true, minWords: 800, maxWords: 1800, weight: 20, description: 'Diseño de investigación, población, instrumentos y procedimientos' },
        { id: 'sec4', name: 'Resultados y Análisis', required: true, minWords: 1000, maxWords: 2500, weight: 25, description: 'Presentación, análisis e interpretación de datos' },
        { id: 'sec5', name: 'Conclusiones y Recomendaciones', required: true, minWords: 500, maxWords: 1000, weight: 15, description: 'Síntesis, limitaciones, aportes y recomendaciones' },
      ],
      rubric: { structure: 25, content: 40, form: 20, originality: 15 },
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      advisorId: currentUser.id,
    };

    onCreateNew(newPattern);
    setLocalPatterns(prev => [...prev, newPattern]);
    setSelectedPatternId(newPattern.id);
    setLocalPattern(newPattern);
    setNewSectionName('');
    toast.success('Nuevo patrón creado', {
      description: 'Ya puedes agregar o editar las secciones y la rúbrica',
    });
  };

  // For advisors: only their own patterns
  const myPatterns = isAdvisor
    ? localPatterns.filter(p => p.createdBy === currentUser.id || p.advisorId === currentUser.id)
    : localPatterns;

  const currentPattern = myPatterns.find(p => p.id === selectedPatternId) || myPatterns[0];

  const [localPattern, setLocalPattern] = useState<ThesisPattern | null>(
    currentPattern ? { ...currentPattern } : null
  );

  // Sync when selection changes
  React.useEffect(() => {
    if (currentPattern) {
      setLocalPattern({ ...currentPattern });
    }
  }, [selectedPatternId]);

  if (!localPattern || myPatterns.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-3xl p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            {isAdvisor ? "Aún no tienes patrones creados" : "No hay patrones disponibles"}
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            {isAdvisor 
              ? "Como asesor, puedes crear tus propios patrones personalizados. Estos se aplicarán automáticamente al analizar los avances de tus estudiantes."
              : "No se encontraron patrones configurados en el sistema."
            }
          </p>

          {canCreate && onCreateNew && (
            <button 
              onClick={handleCreateNew}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg active:scale-[0.985] transition-all shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" /> Crear mi primer Patrón
            </button>
          )}

          <div className="mt-8 text-xs text-muted-foreground">
            Los patrones definen la estructura, secciones y rúbrica que usa la IA para evaluar los avances.
          </div>
        </div>
      </div>
    );
  }

  const updateSection = (id: string, field: keyof PatternSection, value: any) => {
    setLocalPattern(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(sec => 
          sec.id === id ? { ...sec, [field]: value } : sec
        )
      };
    });
  };

  const addSection = () => {
    const trimmedName = newSectionName.trim();
    if (!trimmedName || !localPattern) {
      if (!trimmedName) toast.error('Escribe el nombre de la sección');
      return;
    }
    
    const newSection: PatternSection = {
      id: `sec-${Date.now()}`,
      name: trimmedName,
      required: true,
      minWords: 400,
      maxWords: 1200,
      weight: 8,
      description: 'Nueva sección personalizada para este patrón',
    };
    
    setLocalPattern(prev => {
      if (!prev) return prev;
      return { ...prev, sections: [...prev.sections, newSection] };
    });
    setNewSectionName('');
    toast.success(`Sección "${trimmedName}" agregada`);
  };

  const removeSection = (id: string) => {
    if (!localPattern) return;
    setLocalPattern(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.filter(s => s.id !== id) };
    });
    toast.info('Sección eliminada');
  };

  const handleSave = () => {
    if (!localPattern) return;
    onUpdate(localPattern);
    setLocalPatterns(prev => 
      prev.map(p => p.id === localPattern.id ? localPattern : p)
    );
    toast.success('Patrón actualizado');
  };

  const totalWeight = localPattern.sections.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="glass rounded-3xl p-10 mb-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-sm uppercase tracking-[2px] text-primary mb-1">
              {isAdvisor ? 'MIS PATRONES' : 'CONFIGURACIÓN ACADÉMICA'}
            </div>
            <div className="text-4xl font-bold tracking-tight">
              {isAdvisor ? 'Patrones de mi autoría' : 'Documento Patrón Institucional'}
            </div>
            <div className="text-muted-foreground mt-2">
              {localPattern.version} • {localPattern.program}
            </div>
          </div>
          
          <div className="flex gap-3">
            {canCreate && onCreateNew && (
              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium active:scale-[0.985] transition-all"
              >
                <Plus className="w-5 h-5" /> Nuevo Patrón
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-2xl font-semibold active:scale-[0.985]"
            >
              <Save className="w-5 h-5" /> Guardar Cambios
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-muted/50 rounded-2xl p-6">
            <div className="text-xs text-muted-foreground">NOMBRE DEL PATRÓN</div>
            <input 
              type="text" 
              value={localPattern.name} 
              onChange={(e) => setLocalPattern({...localPattern, name: e.target.value})}
              className="mt-2 w-full bg-transparent text-xl font-semibold focus:outline-none border-b border-border pb-1"
            />
          </div>
          <div className="bg-muted/50 rounded-2xl p-6">
            <div className="text-xs text-muted-foreground mb-2">PROGRAMA ACADÉMICO / ESPECIALIDAD</div>
            <select
              value={localPattern.program || ACADEMIC_PROGRAMS[0]}
              onChange={(e) => setLocalPattern({ ...localPattern, program: e.target.value })}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-base font-medium focus:outline-none focus:border-primary"
            >
              {ACADEMIC_PROGRAMS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Elige la especialidad a la que aplica este patrón
            </p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground">PESO TOTAL DE LA RÚBRICA</div>
              <div className="text-6xl font-bold tabular-nums mt-1 tracking-tighter">{totalWeight}<span className="text-2xl align-super">%</span></div>
            </div>
            {totalWeight !== 100 && (
              <div className="text-xs text-rose-500 mt-2">⚠️ Ajusta los pesos para que sumen 100%</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="font-semibold text-2xl">Estructura de Secciones</div>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Nombre de nueva sección..."
              className="bg-background border border-border rounded-2xl px-5 py-2 text-sm w-72"
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
            />
            <button 
              onClick={addSection}
              disabled={!newSectionName.trim()}
              className="bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-primary px-5 rounded-2xl flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {localPattern.sections.map((section, index) => (
            <motion.div 
              key={section.id}
              layout
              className="bg-muted/40 hover:bg-muted/70 transition-colors rounded-2xl p-6 flex items-center gap-6 group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-mono text-sm flex-shrink-0">
                {String(index + 1).padStart(2, '0')}
              </div>
              
              <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <input 
                    type="text" 
                    value={section.name} 
                    onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                    className="font-semibold bg-transparent w-full focus:outline-none border-b border-transparent focus:border-primary pb-px"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{section.description}</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-[10px] text-muted-foreground mb-1">PALABRAS MÍN / MÁX</div>
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="number" 
                      value={section.minWords} 
                      onChange={(e) => updateSection(section.id, 'minWords', parseInt(e.target.value))}
                      className="w-16 bg-background rounded px-2 py-1 text-center font-mono" 
                    />
                    <span className="text-muted-foreground">—</span>
                    <input 
                      type="number" 
                      value={section.maxWords} 
                      onChange={(e) => updateSection(section.id, 'maxWords', parseInt(e.target.value))}
                      className="w-16 bg-background rounded px-2 py-1 text-center font-mono" 
                    />
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-[10px] text-muted-foreground mb-1">PESO EN RÚBRICA</div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1" 
                      max="35" 
                      value={section.weight} 
                      onChange={(e) => updateSection(section.id, 'weight', parseInt(e.target.value))} 
                      className="accent-primary flex-1" 
                    />
                    <div className="font-mono w-9 text-right text-sm tabular-nums">{section.weight}%</div>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center gap-3 justify-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={section.required} 
                      onChange={(e) => updateSection(section.id, 'required', e.target.checked)} 
                      className="accent-primary" 
                    />
                    Obligatoria
                  </label>
                  
                  <button 
                    onClick={() => removeSection(section.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive p-2 hover:bg-destructive/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Los cambios en la estructura se reflejarán automáticamente en el motor de análisis de Grok-IA
        </div>
      </div>
    </div>
  );
}
