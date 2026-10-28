'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { InstitutionSelect } from '@/components/ui/selects/institution-select';
import { FacultySelect } from '@/components/ui/selects/faculty-select';
import { ProgrammeSelect } from '@/components/ui/selects/programme-select';
import { BranchSelect } from '@/components/ui/selects/branch-select';
import { LevelSelect } from '@/components/ui/selects/level-select';
import { PeriodSelect } from '@/components/ui/selects/period-select';

// ─── Types ───

export interface AcademicProfile {
  institutionId: string | null;
  facultyId: string | null;
  programmeId: string | null;
  branchId: string | null;
  year: number | null;
  period: string | null;
}

interface AcademicLevelItem {
  id: string;
  order: number;
  name: string;
}

interface AcademicPeriodItem {
  id: string;
  order: number;
  name: string;
}

interface InstitutionMeta {
  hasFaculties: boolean;
  hasBranches: boolean;
}

interface AcademicSelectorProps {
  /** Pre-fill values for edit mode */
  initialInstitutionId?: string | null;
  initialFacultyId?: string | null;
  initialProgrammeId?: string | null;
  initialBranchId?: string | null;
  initialYear?: number | null;
  initialPeriod?: string | null;

  /** Called whenever any field changes */
  onChange?: (profile: AcademicProfile) => void;

  /** Disable all fields */
  disabled?: boolean;

  /** Optional wrapper class */
  className?: string;
}

// ─── Component ───

export function AcademicSelector({
  initialInstitutionId,
  initialFacultyId,
  initialProgrammeId,
  initialBranchId,
  initialYear,
  initialPeriod,
  onChange,
  disabled,
  className = 'space-y-4',
}: AcademicSelectorProps) {
  // ── Shared state ──
  const [institutionId, setInstitutionId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [programmeId, setProgrammeId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [levelId, setLevelId] = useState<string>('');
  const [periodId, setPeriodId] = useState<string>('');

  // ── Metadata caches ──
  const [institutionMeta, setInstitutionMeta] = useState<InstitutionMeta | null>(null);
  const [levels, setLevels] = useState<AcademicLevelItem[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodItem[]>([]);

  // ── Initialize from props ──
  useEffect(() => {
    if (initialInstitutionId) setInstitutionId(initialInstitutionId);
    if (initialFacultyId) setFacultyId(initialFacultyId);
    if (initialProgrammeId) setProgrammeId(initialProgrammeId);
    if (initialBranchId) setBranchId(initialBranchId);
    if (initialYear) setLevelId(''); // Will be resolved below
    if (initialPeriod) setPeriodId(''); // Will be resolved below
  }, []);

  // Resolve initial year/period to level/period IDs once metadata loads
  useEffect(() => {
    if (initialYear && initialInstitutionId && !levelId && levels.length > 0) {
      const match = levels.find((l) => l.order === initialYear);
      if (match) setLevelId(match.id);
    }
  }, [initialYear, initialInstitutionId, levelId, levels]);

  useEffect(() => {
    if (initialPeriod && initialInstitutionId && !periodId && periods.length > 0) {
      const match = periods.find((p) => String(p.order) === String(initialPeriod));
      if (match) setPeriodId(match.id);
    }
  }, [initialPeriod, initialInstitutionId, periodId, periods]);

  // ── Fetch institution metadata ──
  const fetchInstitutionMeta = useCallback(
    async (instId: string) => {
      if (!instId) {
        setInstitutionMeta(null);
        setLevels([]);
        setPeriods([]);
        return;
      }
      try {
        const [levelsRes, periodsRes, instRes] = await Promise.all([
          fetch(`/api/admin/levels?institutionId=${instId}`).then((r) => r.json()).catch(() => ({ data: [] as AcademicLevelItem[] })),
          fetch(`/api/admin/periods?institutionId=${instId}`).then((r) => r.json()).catch(() => ({ data: [] as AcademicPeriodItem[] })),
          fetch('/api/institutions/picker').then((r) => r.json()).catch(() => ({ data: [] as any[] })),
        ]);
        const lvlData = Array.isArray(levelsRes.data) ? levelsRes.data : [];
        const perData = Array.isArray(periodsRes.data) ? periodsRes.data : [];
        const instData = Array.isArray(instRes.data) ? instRes.data : [];
        const inst = instData.find((i: any) => i.id === instId);

        setLevels(lvlData);
        setPeriods(perData);
        setInstitutionMeta({
          hasFaculties: inst?.hasFaculties ?? false,
          hasBranches: inst?.hasBranches ?? false,
        });
      } catch (e) {
        console.error('Failed to fetch institution metadata:', e);
        setLevels([]);
        setPeriods([]);
        setInstitutionMeta({ hasFaculties: false, hasBranches: false });
      }
    },
    []
  );

  // ── Cascade: when institution changes, fetch meta and reset children ──
  const handleInstitutionChange = (value: string) => {
    setInstitutionId(value);
    setFacultyId('');
    setProgrammeId('');
    setBranchId('');
    setLevelId('');
    setPeriodId('');
    setLevels([]);
    setPeriods([]);
    fetchInstitutionMeta(value);
  };

  // ── Cascade: when faculty changes, reset programme/branch ──
  const handleFacultyChange = (value: string) => {
    setFacultyId(value);
    setProgrammeId('');
    setBranchId('');
  };

  // ── Cascade: when programme changes, reset branch ──
  const handleProgrammeChange = (value: string) => {
    setProgrammeId(value);
    setBranchId('');
  };

  // ── Build profile from current state ──
  const profile = useMemo<AcademicProfile>(() => {
    // Map level ID → order (year)
    const selectedLevel = levels.find((l) => l.id === levelId);
    const year = selectedLevel ? selectedLevel.order : null;

    // Map period ID → order (period)
    const selectedPeriod = periods.find((p) => p.id === periodId);
    const period = selectedPeriod ? String(selectedPeriod.order) : null;

    return {
      institutionId: institutionId || null,
      facultyId: facultyId || null,
      programmeId: programmeId || null,
      branchId: branchId || null,
      year,
      period,
    };
  }, [institutionId, facultyId, programmeId, branchId, levelId, periodId, levels, periods]);

  // ── Notify parent on change ──
  useEffect(() => {
    onChange?.(profile);
  }, [profile, onChange]);

  // ── Render ──
  return (
    <div className={className}>
      <InstitutionSelect
        value={institutionId}
        onChange={handleInstitutionChange}
        disabled={disabled}
      />

      {institutionMeta?.hasFaculties && (
        <FacultySelect
          institutionId={institutionId || undefined}
          value={facultyId}
          onChange={handleFacultyChange}
          disabled={disabled}
        />
      )}

      <ProgrammeSelect
        institutionId={institutionId || undefined}
        value={programmeId}
        onChange={handleProgrammeChange}
        disabled={disabled}
      />

      {institutionMeta?.hasBranches && (
        <BranchSelect
          programmeId={programmeId || undefined}
          value={branchId}
          onChange={setBranchId}
          disabled={disabled}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <LevelSelect
          institutionId={institutionId || undefined}
          value={levelId}
          onChange={setLevelId}
          disabled={disabled}
          label="Year / Level"
        />
        <PeriodSelect
          institutionId={institutionId || undefined}
          value={periodId}
          onChange={setPeriodId}
          disabled={disabled}
          label="Semester / Period"
        />
      </div>
    </div>
  );
}
