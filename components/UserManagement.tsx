'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { UserPlus, Mail, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface UserManagementProps {
  users: User[];
  onAssignAdvisor: (studentId: string, advisorId: string) => void;
  onUpdateOrcid?: (userId: string, newOrcid: string) => void;
}

export default function UserManagement({ users, onAssignAdvisor, onUpdateOrcid }: UserManagementProps) {
  const students = users.filter(u => u.role === 'estudiante');
  const advisors = users.filter(u => u.role === 'asesor' || u.role === 'coordinador');

  // Local editing state for ORCID per user
  const [editingOrcid, setEditingOrcid] = useState<Record<string, string>>({});
  const [savingOrcid, setSavingOrcid] = useState<Record<string, boolean>>({});

  return (
    <div className="glass rounded-3xl p-10">
      <div className="flex justify-between mb-10">
        <div>
          <div className="text-4xl font-bold tracking-tight">Gestión de Usuarios</div>
          <div className="text-muted-foreground">Administra roles, permisos y asignaciones de asesores</div>
        </div>
        <button 
          onClick={() => toast.info('Funcionalidad de invitación (demo)')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm"
        >
          <UserPlus className="w-4 h-4" /> Invitar Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="uppercase text-xs tracking-widest text-muted-foreground">
              ESTUDIANTES ({students.length})
            </div>
            <div className="flex gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                Elegido en registro
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                Reasignado por admin
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.id} className="flex items-center justify-between p-5 bg-muted/40 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {student.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {student.name}
                      {student.advisorId && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          student.advisorAssignedManually 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {student.advisorAssignedManually ? "Reasignado por admin" : "Elegido en registro"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{student.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 min-w-[260px]">
                  <select 
                    className="bg-background border border-border rounded-xl px-4 py-2 text-sm flex-1"
                    value={student.advisorId || ''}
                    onChange={(e) => onAssignAdvisor(student.id, e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {advisors.map(ad => (
                      <option key={ad.id} value={ad.id}>{ad.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisors & Coordinadores - with ORCID management */}
        <div>
          <div className="uppercase text-xs tracking-widest text-muted-foreground mb-4 px-1">
            ASESORES Y COORDINADORES ({advisors.length}) — Conteo según relación actual (registro + reasignaciones)
          </div>
          <div className="space-y-3">
            {advisors.map(advisor => {
              const assignedCount = students.filter(s => s.advisorId === advisor.id).length;
              const isEditing = editingOrcid.hasOwnProperty(advisor.id);
              const currentOrcid = isEditing ? editingOrcid[advisor.id] : (advisor.orcid || '');

              return (
                <div key={advisor.id} className="p-5 bg-muted/40 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                        {advisor.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div className="font-semibold">{advisor.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{advisor.role} • {advisor.program}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-2xl tabular-nums">{assignedCount}</div>
                      <div className="text-[10px] text-muted-foreground -mt-1">estudiantes</div>
                    </div>
                  </div>

                  {/* ORCID Management for Admin */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-muted-foreground w-16">ORCID:</div>
                    
                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={currentOrcid}
                          onChange={(e) => setEditingOrcid(prev => ({ ...prev, [advisor.id]: e.target.value }))}
                          placeholder="0000-0000-0000-0000"
                          className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-mono"
                        />
                        <button
                          onClick={async () => {
                            if (!onUpdateOrcid) return;
                            setSavingOrcid(prev => ({ ...prev, [advisor.id]: true }));
                            try {
                              await onUpdateOrcid(advisor.id, currentOrcid);
                              toast.success('ORCID actualizado');
                              setEditingOrcid(prev => {
                                const copy = { ...prev };
                                delete copy[advisor.id];
                                return copy;
                              });
                            } catch {
                              toast.error('Error al actualizar ORCID');
                            } finally {
                              setSavingOrcid(prev => ({ ...prev, [advisor.id]: false }));
                            }
                          }}
                          disabled={savingOrcid[advisor.id]}
                          className="px-3 py-1.5 bg-primary text-white rounded-xl text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button
                          onClick={() => setEditingOrcid(prev => {
                            const copy = { ...prev };
                            delete copy[advisor.id];
                            return copy;
                          })}
                          className="px-3 py-1.5 bg-white/10 rounded-xl text-sm flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="font-mono text-sm bg-background px-3 py-1 rounded-xl flex-1 border border-border/50">
                          {advisor.orcid || <span className="text-muted-foreground italic">Sin ORCID registrado</span>}
                        </div>
                        <button
                          onClick={() => setEditingOrcid(prev => ({ ...prev, [advisor.id]: advisor.orcid || '' }))}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
