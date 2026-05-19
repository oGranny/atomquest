'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { 
  PlusCircleIcon, 
  CheckCircle2Icon, 
  Edit3Icon, 
  TimerIcon, 
  ScaleIcon, 
  TargetIcon,
  Trash2Icon,
  HistoryIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  MessageSquareIcon,
  CalendarIcon,
  AlertCircleIcon,
  LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GoalSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading, devMode } = useAuth();
  const router = useRouter();
  const [sheet, setSheet] = useState<any>(null);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  
  const isInternalUpdate = useRef(false);

  // Helper to determine active quarter based on date
  const getActiveQuarter = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 2) return 'Q1'; // Jan to Mar
    if (month >= 3 && month <= 5) return 'Q2'; // Apr to Jun
    if (month >= 6 && month <= 8) return 'Q3'; // Jul to Sep
    return 'Q4'; // Oct to Dec
  };

  const activeQuarter = getActiveQuarter();

  // Form State
  const [formData, setFormData] = useState({
    thrustArea: '',
    title: '',
    description: '',
    uom: 'NUMERIC',
    direction: 'HIGHER_IS_BETTER',
    target: '',
    weightage: '10',
    deadline: '',
  });

  // Check-In State
  const [selectedQuarter, setSelectedQuarter] = useState(activeQuarter);
  const [checkInData, setCheckInData] = useState({
    actualAchievement: '',
    status: 'NOT_STARTED',
    achievementDate: '',
    employeeComment: ''
  });
  const [isLogging, setIsLogging] = useState(false);

  const canEditQuarter = devMode || selectedQuarter === activeQuarter;

  useEffect(() => {
    if (user) loadInitialData();
  }, [user, id]);

  const loadInitialData = async () => {
    setFetching(true);
    try {
      const sheets = await fetchApi('/goals/my-sheets');
      setAllSheets(sheets);
      
      const currentSheet = sheets.find((s: any) => s.id === id);
      if (!currentSheet) {
          router.push('/dashboard/builder');
          return;
      }
      
      setSheet(currentSheet);
      
      if (currentSheet.goals.length > 0 && !selectedGoalId) {
        const firstGoal = currentSheet.goals[0];
        setSelectedGoalId(firstGoal.id);
        fillForm(firstGoal);
        fillCheckInForm(firstGoal, activeQuarter);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!selectedGoalId || !canEdit || isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
    }

    const timeoutId = setTimeout(async () => {
        setIsAutosaving(true);
        try {
            const payload = {
                ...formData,
                target: parseFloat(formData.target || '0'),
                weightage: parseFloat(formData.weightage || '10'),
                goalSheetId: id,
                deadline: formData.uom === 'TIMELINE' ? formData.deadline : null
            };
            await fetchApi(`/goals/goal/${selectedGoalId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            
            const sheets = await fetchApi('/goals/my-sheets');
            const freshSheet = sheets.find((s: any) => s.id === id);
            setSheet(freshSheet);
        } catch (error) {
            console.error('Autosave failed', error);
        } finally {
            setIsAutosaving(false);
        }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const loadSheet = async (preserveId?: string) => {
    try {
      const sheets = await fetchApi('/goals/my-sheets');
      const currentSheet = sheets.find((s: any) => s.id === id);
      setSheet(currentSheet);
      
      const effectiveId = preserveId || selectedGoalId;
      if (currentSheet.goals.length > 0 && !effectiveId) {
        const firstGoal = currentSheet.goals[0];
        setSelectedGoalId(firstGoal.id);
        fillForm(firstGoal);
        fillCheckInForm(firstGoal, selectedQuarter);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fillForm = (goal: any) => {
    isInternalUpdate.current = true;
    setFormData({
      thrustArea: goal.thrustArea,
      title: goal.title,
      description: goal.description || '',
      uom: goal.uom,
      direction: goal.direction || 'HIGHER_IS_BETTER',
      target: goal.target.toString(),
      weightage: goal.weightage.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    });
  };

  const fillCheckInForm = (goal: any, quarter: string) => {
      const checkIn = goal.checkIns?.find((c: any) => c.quarter === quarter);
      setCheckInData({
          actualAchievement: checkIn?.actualAchievement?.toString() ?? (goal.uom === 'ZERO_BASED' ? '0' : ''),
          status: checkIn?.status ?? 'NOT_STARTED',
          achievementDate: checkIn?.achievementDate ? new Date(checkIn.achievementDate).toISOString().split('T')[0] : '',
          employeeComment: checkIn?.employeeComment ?? ''
      });
  };

  const handleGoalSelect = (goal: any) => {
    if (goal.id === selectedGoalId) return;
    setSelectedGoalId(goal.id);
    fillForm(goal);
    fillCheckInForm(goal, selectedQuarter);
  };

  const handleQuarterSelect = (quarter: string) => {
      setSelectedQuarter(quarter);
      if (selectedGoalId) {
          const goal = sheet.goals.find((g: any) => g.id === selectedGoalId);
          if (goal) fillCheckInForm(goal, quarter);
      }
  };

  const handleAddNewSlot = () => {
    setSelectedGoalId(null);
    isInternalUpdate.current = true;
    setFormData({
        thrustArea: '',
        title: '',
        description: '',
        uom: 'NUMERIC',
        direction: 'HIGHER_IS_BETTER',
        target: '',
        weightage: '10',
        deadline: '',
    });
  };

  const commitNewGoal = async () => {
    try {
      const payload = {
        ...formData,
        target: parseFloat(formData.target || '0'),
        weightage: parseFloat(formData.weightage || '10'),
        goalSheetId: id,
        deadline: formData.uom === 'TIMELINE' ? formData.deadline : null
      };

      const newGoal = await fetchApi('/goals/goal', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      toast.success('Goal slot initialized');
      setSelectedGoalId(newGoal.id);
      loadSheet(newGoal.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await fetchApi(`/goals/goal/${goalId}`, { method: 'DELETE' });
      toast.success('Slot cleared');
      setSelectedGoalId(null);
      loadSheet();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const submitSheet = async () => {
    try {
      await fetchApi(`/goals/submit/${id}`, { method: 'POST' });
      toast.success('Goal sheet submitted for precision review');
      loadSheet();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveProgress = async () => {
      if (!selectedGoalId) return;
      setIsLogging(true);
      try {
        await fetchApi('/checkins/log', {
            method: 'POST',
            body: JSON.stringify({
              ...checkInData,
              goalId: selectedGoalId,
              quarter: selectedQuarter,
              actualAchievement: parseFloat(checkInData.actualAchievement || '0'),
            }),
        });
        toast.success(`Progress logged for ${selectedQuarter}`);
        loadSheet(selectedGoalId);
      } catch (error: any) {
          toast.error(error.message);
      } finally {
          setIsLogging(false);
      }
  };

  const calculateScore = () => {
      const goal = sheet?.goals.find((g: any) => g.id === selectedGoalId);
      if (!goal) return 0;
      
      const actual = parseFloat(checkInData.actualAchievement || '0');
      const target = goal.target;

      switch (goal.uom) {
          case 'NUMERIC':
          case 'PERCENTAGE':
              if (goal.direction === 'HIGHER_IS_BETTER') {
                  return target === 0 ? 0 : (actual / target) * 100;
              } else {
                  return actual === 0 ? 100 : (target / actual) * 100;
              }
          case 'ZERO_BASED':
          case 'TIMELINE':
              return Math.min(100, Math.max(0, actual));
          default:
              return 0;
      }
  };

  if (fetching || !sheet) return <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase">Calibrating...</div>;

  const totalWeightage = sheet.goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
  const otherGoalsWeightage = sheet.goals.filter((g: any) => g.id !== selectedGoalId).reduce((sum: number, g: any) => sum + g.weightage, 0);
  const maxAllowedWeightage = 100 - otherGoalsWeightage;
  const canEdit = sheet.status === 'DRAFT' || sheet.status === 'RETURNED';
  const slots = Array.from({ length: 8 }, (_, i) => sheet.goals[i] || null);

  const isShared = sheet?.goals.find((g: any) => g.id === selectedGoalId)?.isShared || false;
  const isEmployee = user?.role === 'EMPLOYEE';
  const isSharedLocked = isShared && isEmployee;

  return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">      <Header title="Goal Builder" />
      
      <div className="flex-1 flex overflow-hidden bg-surface-container-low/50 relative">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
        
        {/* Left Panel: Slots */}
        <section className="w-[380px] border-r border-outline-variant flex flex-col bg-card z-10">
            <div className="p-8 border-b border-outline-variant flex flex-col gap-4 bg-surface-bright">
                <div className="flex justify-between items-center">
                    <h2 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">Your Slots</h2>
                    <div className={cn(
                        "glass-status px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        sheet.goals.length === 8 ? "border-[#4CAF50] text-[#2E7D32]" : "border-primary text-primary"
                    )}>
                        {sheet.goals.length}/8 FILLED
                    </div>
                </div>

                <Select value={id} onValueChange={(val) => router.push(`/dashboard/sheet/${val}`)}>
                    <SelectTrigger className="w-full bg-card border-outline-variant/40 rounded-xl h-12 px-4 shadow-sm hover:border-primary-container transition-all">
                        <div className="flex items-center gap-2">
                             <span className="font-headline text-[10px] font-black uppercase tracking-widest text-on-surface-variant">ACTIVE CYCLE:</span>
                             <span className="font-headline text-xs font-bold text-on-surface">CYCLE {sheet.cycleYear}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-outline-variant/40 shadow-xl">
                        {allSheets.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="font-headline text-xs font-bold py-3 uppercase tracking-wider">
                                CYCLE {s.cycleYear} {s.status === 'APPROVED' ? '✓' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {slots.map((goal, index) => (
                    <div 
                        key={index}
                        onClick={() => {
                            if (goal) {
                                handleGoalSelect(goal);
                            } else if (canEdit) {
                                if (totalWeightage >= 100) {
                                    toast.error('System Saturation: Total weightage reached 100%. Reduce other slots to add new goals.');
                                } else {
                                    handleAddNewSlot();
                                }
                            }
                        }}
                        className={cn(
                            "p-6 rounded-2xl border-l-4 shadow-sm transition-all duration-300 group",
                            goal 
                                ? (selectedGoalId === goal.id 
                                    ? "bg-secondary text-white border-primary shadow-lg scale-[1.02]" 
                                    : "bg-card border-primary hover:border-primary-container hover:shadow-md cursor-pointer")
                                : (totalWeightage >= 100 
                                    ? "border-2 border-dashed border-outline-variant/20 bg-surface-container-low/50 opacity-40 cursor-not-allowed"
                                    : "border-2 border-dashed border-outline-variant/40 flex items-center justify-center gap-3 text-on-surface-variant/40 hover:bg-surface-container-high/50 cursor-pointer")
                        )}
                    >
                        {goal ? (
                            <>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={cn("font-sans text-[9px] font-black uppercase tracking-[0.2em]", selectedGoalId === goal.id ? "text-primary" : "text-primary/60")}>
                                        SLOT {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {selectedGoalId === goal.id ? <Edit3Icon className="h-4 w-4 text-primary" /> : <CheckCircle2Icon className="h-4 w-4 text-[#4CAF50]" />}
                                </div>
                                <h3 className="font-headline text-sm font-bold leading-snug mb-1 truncate">{goal.title}</h3>
                                <p className={cn("font-sans text-[10px] font-medium opacity-60 line-clamp-1", selectedGoalId === goal.id ? "text-white" : "text-on-surface-variant")}>{goal.thrustArea}</p>
                            </>
                        ) : (
                            <>
                                <PlusCircleIcon className="h-5 w-5 opacity-20 group-hover:scale-110 transition-transform" />
                                <span className="font-headline text-[10px] font-bold uppercase tracking-widest">Initialise Slot {String(index + 1).padStart(2, '0')}</span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>

        {/* Right Panel: Editor */}
        <section className="flex-1 flex flex-col p-12 overflow-y-auto z-10">
            <div className="max-w-[900px] w-full mx-auto space-y-12">
                
                {/* Editor Header */}
                <div className="flex justify-between items-end border-b border-outline-variant pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={cn("h-1.5 w-1.5 rounded-full", isAutosaving ? "bg-[#4CAF50] animate-ping" : "bg-primary animate-pulse")}></div>
                            <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
                                {isAutosaving ? 'Auto-Syncing Engine...' : (selectedGoalId ? `Editing Global Objective` : `Strategic Slot`)}
                            </span>
                        </div>
                        <h2 className="font-headline text-4xl font-black text-on-surface leading-tight uppercase tracking-tighter">
                            {formData.title || "Undefined Goal"}
                        </h2>
                    </div>
                    <div className="flex gap-4 pb-1">
                        {canEdit && (
                            <>
                                {selectedGoalId ? (
                                    <Button variant="ghost" className="text-error font-bold uppercase text-[10px] tracking-widest hover:bg-error-container/20 px-6" onClick={() => deleteGoal(selectedGoalId)} disabled={isSharedLocked}>
                                        <Trash2Icon className="h-4 w-4 mr-2" /> Clear Slot
                                    </Button>
                                ) : (
                                    <Button className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest px-10 h-12 rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all" onClick={commitNewGoal}>
                                        Commit Goal to Slot
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Manager Revision Feedback */}
                {sheet.status === 'RETURNED' && sheet.revisionComment && (
                    <div className="bg-error-container/30 border-2 border-error/20 p-8 rounded-[2rem] flex gap-6 items-start shadow-sm">
                        <div className="h-12 w-12 rounded-2xl bg-error text-white flex items-center justify-center shrink-0 shadow-lg">
                            <RefreshCwIcon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-error uppercase tracking-[0.3em]">Manager Feedback (Rework Required)</span>
                            </div>
                            <p className="font-sans text-on-surface font-bold text-lg leading-relaxed">
                                "{sheet.revisionComment}"
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <Label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">Goal Specification</Label>
                        <Input 
                            disabled={!canEdit || isSharedLocked}
                            placeholder="e.g., Optimize Motor Thermal Efficiency"
                            className="bg-card border-outline-variant/40 rounded-xl h-14 px-6 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-on-surface disabled:opacity-50" 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">Thrust Focus Area</Label>
                        <Input 
                             disabled={!canEdit || isSharedLocked}
                             placeholder="e.g., R&D Innovation"
                             className="bg-card border-outline-variant/40 rounded-xl h-14 px-6 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-on-surface disabled:opacity-50" 
                             value={formData.thrustArea}
                             onChange={e => setFormData({...formData, thrustArea: e.target.value})}
                        />
                    </div>
                    <div className="space-y-3 col-span-2">
                        <Label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">Technical Description & Strategic Impact</Label>
                        <Textarea 
                            disabled={!canEdit || isSharedLocked}
                            placeholder="Define the scope, methodology, and intended impact of this objective..."
                            className="bg-card border-outline-variant/40 rounded-xl p-6 focus:ring-4 focus:ring-primary/10 transition-all min-h-[140px] font-medium text-on-surface leading-relaxed shadow-sm disabled:opacity-50" 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                {/* Target & Weightage Bento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="rounded-3xl shadow-level-1 border border-outline-variant/40 overflow-hidden group bg-card">
                        <CardContent className="p-8 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="font-headline text-2xl font-bold text-on-surface">Weightage</h3>
                            </div>
                            <div className="flex items-center justify-between w-full mb-auto">
                                <Button 
                                    disabled={!canEdit} 
                                    variant="secondary" 
                                    className="w-16 h-16 bg-secondary text-white rounded-2xl shadow-lg hover:bg-black active:scale-90 transition-all flex items-center justify-center" 
                                    onClick={() => setFormData({...formData, weightage: (Math.max(10, parseInt(formData.weightage || '10') - 5)).toString()})}
                                >
                                    <span className="text-xl font-bold">-</span>
                                </Button>
                                <div className="flex-1 text-center">
                                    <input 
                                        type="number"
                                        disabled={!canEdit}
                                        className="font-headline text-6xl font-black text-on-surface tracking-tighter bg-transparent border-none p-0 text-center w-32 focus:ring-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={formData.weightage}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? '' : Math.max(10, Math.min(maxAllowedWeightage, parseInt(e.target.value || '10'))).toString();
                                            setFormData({...formData, weightage: val});
                                        }}
                                        onBlur={() => {
                                            if (formData.weightage === '' || parseInt(formData.weightage) < 10) setFormData({...formData, weightage: '10'});
                                        }}
                                    />
                                    <span className="font-headline text-3xl font-bold text-on-surface ml-1">%</span>
                                </div>
                                <Button 
                                    disabled={!canEdit} 
                                    variant="secondary" 
                                    className="w-16 h-16 bg-secondary text-white rounded-2xl shadow-lg hover:bg-black active:scale-90 transition-all flex items-center justify-center" 
                                    onClick={() => setFormData({...formData, weightage: (Math.min(maxAllowedWeightage, parseInt(formData.weightage || '0') + 5)).toString()})}
                                >
                                    <span className="text-xl font-bold">+</span>
                                </Button>
                            </div>
                            <p className="font-sans text-sm text-on-surface-variant font-medium mt-10">Minimum weightage per individual goal is 10%.</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-level-1 border border-outline-variant/40 overflow-hidden group bg-card">
                        <CardContent className="p-8 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-3">
                                    <ScaleIcon className="h-6 w-6 text-primary" /> Target Specification
                                </h3>
                                {(formData.uom === 'NUMERIC' || formData.uom === 'PERCENTAGE') && (
                                    <Select value={formData.direction} onValueChange={val => val && setFormData({...formData, direction: val})} disabled={!canEdit || isSharedLocked}>
                                        <SelectTrigger className="w-40 bg-surface-container-low border-none rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HIGHER_IS_BETTER" className="text-[10px] font-bold">
                                                <div className="flex items-center gap-2"><TrendingUpIcon className="h-3 w-3" /> MIN (Higher better)</div>
                                            </SelectItem>
                                            <SelectItem value="LOWER_IS_BETTER" className="text-[10px] font-bold">
                                                <div className="flex items-center gap-2"><TrendingDownIcon className="h-3 w-3" /> MAX (Lower better)</div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center justify-center w-full mb-auto space-y-6">
                                <div className="flex items-end justify-center gap-4 w-full">
                                    {formData.uom === 'TIMELINE' ? (
                                        <div className="space-y-2 w-full text-center">
                                            <Input 
                                                disabled={!canEdit || isSharedLocked}
                                                type="date"
                                                className="font-headline text-3xl font-black text-on-surface border-none bg-surface-container-low rounded-xl h-16 text-center focus:ring-4 focus:ring-primary/10 tracking-tight disabled:opacity-50" 
                                                value={formData.deadline}
                                                onChange={e => setFormData({...formData, deadline: e.target.value})}
                                            />
                                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Set Completion Deadline</Label>
                                        </div>
                                    ) : formData.uom === 'ZERO_BASED' ? (
                                        <div className="text-center space-y-4">
                                            <Select value={formData.target || '0'} onValueChange={val => val && setFormData({...formData, target: val})} disabled={!canEdit || isSharedLocked}>
                                                <SelectTrigger className="w-48 bg-surface-container-low border-none rounded-xl font-headline text-3xl font-black h-20 px-6 shadow-sm mx-auto">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0" className="font-headline text-xl font-bold py-4">0</SelectItem>
                                                    <SelectItem value="1" className="font-headline text-xl font-bold py-4">1</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Set Success Benchmark</Label>
                                        </div>
                                    ) : (
                                        <>
                                            <Input 
                                                disabled={!canEdit || isSharedLocked}
                                                type="number"
                                                placeholder="0"
                                                className="font-headline text-6xl font-black text-on-surface border-none bg-transparent p-0 text-center focus:ring-0 w-32 tracking-tighter disabled:opacity-50" 
                                                value={formData.target}
                                                onChange={e => setFormData({...formData, target: e.target.value})}
                                            />
                                            <span className="font-sans text-2xl text-on-surface-variant mb-2 lowercase">{formData.uom === 'PERCENTAGE' ? '%' : 'units'}</span>
                                        </>
                                    )}
                                </div>
                                <Select value={formData.uom} onValueChange={val => val && setFormData({...formData, uom: val})} disabled={!canEdit || isSharedLocked}>
                                    <SelectTrigger className="w-48 bg-surface-container-low border-none rounded-xl font-bold text-sm h-14 px-6 shadow-sm mx-auto">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NUMERIC">NUMERIC</SelectItem>
                                        <SelectItem value="PERCENTAGE">PERCENTAGE</SelectItem>
                                        <SelectItem value="TIMELINE">TIMELINE</SelectItem>
                                        <SelectItem value="ZERO_BASED">Binary (Pass/Fail)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quarterly Progress Tracking Section */}
                {selectedGoalId && sheet?.status === 'APPROVED' && (
                    <Card className="rounded-3xl shadow-level-1 border border-outline-variant/40 bg-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                            <ActivityIcon className="h-48 w-48 text-primary" />
                        </div>
                        <CardContent className="p-10 relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center">
                                        <ActivityIcon className="h-6 w-6 text-on-primary-container" />
                                    </div>
                                    <div>
                                        <h3 className="font-headline text-2xl font-bold text-on-surface">Quarterly Progress Tracking</h3>
                                        <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-60 mt-1">Log achievements against the target</p>
                                    </div>
                                </div>
                                <Select value={selectedQuarter} onValueChange={(val) => val && handleQuarterSelect(val)}>
                                    <SelectTrigger className="w-48 bg-surface-container-low border-none rounded-xl h-12 px-6 shadow-sm font-bold text-sm uppercase tracking-widest text-on-surface">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-outline-variant/40 shadow-xl">
                                        {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                                            <SelectItem key={q} value={q} className="font-bold text-xs py-3 uppercase tracking-wider">
                                                {q} Tracking {q !== activeQuarter ? '(LOCKED)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-surface-container-low/30 rounded-2xl p-8 border border-outline-variant/30 relative">
                                {!canEditQuarter && (
                                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-50 rounded-2xl flex items-center justify-center">
                                        <div className="bg-card p-6 rounded-2xl border border-outline-variant shadow-xl flex flex-col items-center gap-3">
                                            <LockIcon className="h-8 w-8 text-on-surface-variant opacity-40" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Quarter Segment Locked</p>
                                            <p className="text-[10px] font-bold text-on-surface-variant/40 max-w-[200px] text-center">Only the active quarter ({activeQuarter}) can be modified without Developer Override.</p>
                                        </div>
                                    </div>
                                )}
                                {/* Left: Logging Form */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Actual Achievement</Label>
                                        <div className="relative flex items-center">
                                            <Input 
                                                disabled={!canEditQuarter}
                                                type="number" 
                                                step="0.01" 
                                                placeholder={`0 ${formData.uom === 'PERCENTAGE' || formData.uom === 'TIMELINE' || formData.uom === 'ZERO_BASED' ? '%' : 'units'}`}
                                                className="bg-card border-outline-variant rounded-xl h-14 px-6 focus:ring-4 focus:ring-primary/10 transition-all font-headline font-black text-2xl tracking-tighter text-on-surface shadow-sm"
                                                value={checkInData.actualAchievement} 
                                                onChange={(e) => setCheckInData({ ...checkInData, actualAchievement: e.target.value })} 
                                            />
                                            <span className="absolute right-6 text-on-surface-variant font-black uppercase text-xs opacity-40">
                                                {formData.uom === 'PERCENTAGE' || formData.uom === 'TIMELINE' || formData.uom === 'ZERO_BASED' ? '%' : formData.uom}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Status</Label>
                                        <Select disabled={!canEditQuarter} value={checkInData.status} onValueChange={(value) => value && setCheckInData({ ...checkInData, status: value })}>
                                            <SelectTrigger className="bg-card border-outline-variant rounded-xl h-12 px-5 font-bold text-xs focus:ring-4 focus:ring-primary/10 shadow-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                                                <SelectItem value="NOT_STARTED" className="font-bold text-xs py-3 uppercase tracking-wider">Not Started</SelectItem>
                                                <SelectItem value="ON_TRACK" className="font-bold text-xs py-3 uppercase tracking-wider text-primary">On Track</SelectItem>
                                                <SelectItem value="COMPLETED" className="font-bold text-xs py-3 uppercase tracking-wider text-[#2E7D32]">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Employee Check-in Notes</Label>
                                        <div className="relative">
                                            <MessageSquareIcon className="absolute left-4 top-4 h-5 w-5 text-on-surface-variant opacity-30" />
                                            <Textarea 
                                                disabled={!canEditQuarter}
                                                placeholder="Document challenges, support needed, or general updates..." 
                                                className="bg-card border-outline-variant rounded-2xl pl-12 p-4 focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px] font-medium text-sm text-on-surface shadow-sm"
                                                value={checkInData.employeeComment}
                                                onChange={(e) => setCheckInData({ ...checkInData, employeeComment: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <Button 
                                            disabled={isLogging || !canEditQuarter}
                                            onClick={handleSaveProgress}
                                            className="w-full bg-secondary text-white font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-lg hover:bg-on-surface active:scale-95 transition-all"
                                        >
                                            {isLogging ? 'Logging...' : 'Commit Progress'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Right: Scoring Dashboard */}
                                <div className="border-l border-outline-variant/30 pl-10 flex flex-col justify-center">
                                    <div className="text-center mb-8">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">Computed Precision Score</span>
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <span className={cn(
                                                "font-headline text-7xl font-black tracking-tighter leading-none drop-shadow-md",
                                                calculateScore() >= 100 ? "text-[#4CAF50]" : calculateScore() > 0 ? "text-primary" : "text-on-surface-variant"
                                            )}>
                                                {Math.round(calculateScore())}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Manager Feedback Read-Only */}
                                    {sheet.goals.find((g: any) => g.id === selectedGoalId)?.checkIns?.find((c: any) => c.quarter === selectedQuarter)?.managerComment && (
                                        <div className="bg-primary-container/10 border border-primary-container/20 rounded-2xl p-6 relative overflow-hidden mt-auto">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Manager Feedback</span>
                                            <p className="font-medium text-sm text-on-surface italic leading-relaxed">
                                                "{sheet.goals.find((g: any) => g.id === selectedGoalId).checkIns.find((c: any) => c.quarter === selectedQuarter).managerComment}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </section>
      </div>

      {/* Footer: Weightage Meter */}
      <footer className="h-24 bg-card border-t border-outline-variant flex items-center px-12 gap-8 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 shrink-0">
             <ScaleIcon className="h-6 w-6 text-on-surface" />
             <span className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">TOTAL WEIGHTAGE</span>
          </div>
          
          <div className="flex-1 mx-8 h-3 bg-surface-container-low rounded-full relative overflow-hidden border border-outline-variant/20 shadow-inner">
             <div 
                className={cn(
                    "absolute left-0 top-0 h-full transition-all duration-700 rounded-full",
                    totalWeightage === 100 ? "bg-[#4CAF50]" : "bg-surface-tint"
                )}
                style={{ width: `${Math.min(100, totalWeightage)}%` }}
             ></div>
          </div>

          <div className="flex items-center gap-8 shrink-0">
             <div className="text-right">
                <span className="font-headline text-2xl font-bold text-on-surface leading-none">{totalWeightage}% <span className="text-sm text-on-surface-variant/60">/ 100%</span></span>
                <p className="font-sans text-[10px] font-medium text-on-surface-variant opacity-60 mt-1">
                    {totalWeightage === 100 ? "Ready for submission." : `You're ${100 - totalWeightage}% away from the requirement.`}
                </p>
             </div>
             <Button 
                className={cn(
                    "font-bold text-base px-10 h-14 rounded-2xl shadow-md transition-all active:scale-95",
                    totalWeightage === 100 
                        ? "bg-primary-container text-on-primary-container hover:brightness-95" 
                        : "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/30"
                )}
                disabled={totalWeightage !== 100 || sheet.status === 'SUBMITTED' || sheet.status === 'APPROVED'}
                onClick={submitSheet}
             >
                Review & Lock
             </Button>
          </div>
      </footer>
    </div>
  );
}