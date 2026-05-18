'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  UsersIcon, 
  ArrowLeftIcon, 
  HistoryIcon, 
  CheckCircle2Icon, 
  SendIcon,
  FilterIcon,
  RefreshCwIcon,
  ArchiveIcon,
  ShieldCheckIcon,
  UnlockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
  ActivityIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ExpandableText = ({ text, label }: { text: string, label: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = text && text.length > 60;
    
    return (
        <div className="flex flex-col group/expand cursor-pointer" onClick={() => isLong && setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] font-black text-on-surface-variant/30 uppercase tracking-widest">{label}</span>
                {isLong && (
                    <span className="text-[8px] font-bold text-primary uppercase animate-pulse">
                        {isExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                )}
            </div>
            <p className={cn(
                "text-[10px] text-on-surface-variant font-bold leading-relaxed transition-all duration-300",
                !isExpanded && isLong ? "line-clamp-1 opacity-60 italic" : "opacity-90 whitespace-pre-wrap"
            )}>
                {text || 'N/A'}
            </p>
        </div>
    );
};

export default function TeamApprovals() {
  const { user: currentUser, devMode } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [approvedSheets, setApprovedSheets] = useState<any[]>([]);
  const [adminRoster, setAdminRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [viewTab, setViewTab] = useState<'PENDING' | 'APPROVED'>('PENDING');
  
  const getActiveQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    return 'Q4';
  };

  const activeQuarter = getActiveQuarter();
  const [selectedQuarter, setSelectedQuarter] = useState(activeQuarter);

  const [editData, setEditData] = useState<{ [key: string]: any }>({});
  const lastEditedGoalId = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadRoster();
    }
  }, [currentUser]);

  const loadRoster = async () => {
    try {
      if (isAdmin) {
        const data = await fetchApi('/goals/admin-roster');
        setAdminRoster(data);
        if (data.length > 0 && !selectedSheet) {
          setSelectedSheet(data[0]);
        }
      } else {
        const [pending, approved] = await Promise.all([
          fetchApi('/goals/pending'),
          fetchApi('/goals/approved-subordinates')
        ]);
        setPendingSheets(pending);
        setApprovedSheets(approved);
        
        const currentList = viewTab === 'PENDING' ? pending : approved;
        if (currentList.length > 0 && !selectedSheet) {
          setSelectedSheet(currentList[0]);
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'return') => {
    try {
      const body = action === 'return' ? { revisionComment } : {};
      await fetchApi(`/goals/${action}/${id}`, { 
        method: 'POST',
        body: JSON.stringify(body)
      });
      toast.success(`Goal sheet ${action === 'return' ? 'returned for rework' : 'approved'}`);
      loadRoster();
      setSelectedSheet(null);
      setIsRevisionDialogOpen(false);
      setRevisionComment('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUnlock = async (id: string) => {
      try {
          await fetchApi(`/goals/unlock/${id}`, { method: 'POST' });
          toast.success('Strategy unlocked and returned to employee.');
          loadRoster();
          setSelectedSheet(null);
      } catch (error: any) {
          toast.error(error.message);
      }
  };

  const onFieldChange = (goalId: string, field: string, value: any) => {
    setEditData(prev => ({
        ...prev,
        [goalId]: {
            ...(prev[goalId] || selectedSheet.goals.find((g: any) => g.id === goalId)),
            [field]: value
        }
    }));
    lastEditedGoalId.current = goalId;
  };

  useEffect(() => {
    if (!lastEditedGoalId.current) return;
    
    const goalId = lastEditedGoalId.current;
    const data = editData[goalId];
    if (!data) return;

    const timeoutId = setTimeout(async () => {
        setIsAutosaving(true);
        try {
            const payload = {
                thrustArea: data.thrustArea,
                title: data.title,
                description: data.description,
                uom: data.uom,
                direction: data.direction,
                target: parseFloat(data.target || '0'),
                weightage: parseFloat(data.weightage || '0'),
                deadline: data.deadline
            };
            await fetchApi(`/goals/goal/${goalId}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            const updatedGoals = selectedSheet.goals.map((g: any) => g.id === goalId ? { ...g, ...data } : g);
            setSelectedSheet({ ...selectedSheet, goals: updatedGoals });
        } catch (error) {
            console.error('Pivot failed', error);
        } finally {
            setIsAutosaving(false);
            lastEditedGoalId.current = null;
        }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [editData]);

  if (loading) return <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase">Initializing...</div>;

  const currentList = isAdmin ? adminRoster : (viewTab === 'PENDING' ? pendingSheets : approvedSheets);
  const currentGoals = selectedSheet?.goals || [];
  
  const isReadOnly = !isAdmin && viewTab === 'APPROVED';

  const totalWeightage = currentGoals.reduce((sum: number, g: any) => {
      const edit = editData[g.id];
      return sum + parseFloat(edit?.weightage ?? g.weightage);
  }, 0);

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      
      {/* Team Member Sidebar */}
      <section className="w-72 border-r border-outline-variant bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-outline-variant bg-surface-bright">
            <h3 className="font-headline text-lg font-black uppercase tracking-tight text-on-surface">Team Roster</h3>
            
            {!isAdmin && (
                <div className="flex gap-2 mt-4 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
                    <button 
                        onClick={() => { setViewTab('PENDING'); setSelectedSheet(null); }}
                        className={cn("flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", viewTab === 'PENDING' ? "bg-card shadow-sm text-on-surface border border-outline-variant/20" : "text-on-surface-variant opacity-40")}
                    >
                        Queue ({pendingSheets.length})
                    </button>
                    <button 
                        onClick={() => { setViewTab('APPROVED'); setSelectedSheet(null); }}
                        className={cn("flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all", viewTab === 'APPROVED' ? "bg-card shadow-sm text-on-surface border border-outline-variant/20" : "text-on-surface-variant opacity-40")}
                    >
                        Locked ({approvedSheets.length})
                    </button>
                </div>
            )}
            {isAdmin && (
                <p className="font-sans text-[9px] text-on-surface-variant font-bold opacity-40 uppercase tracking-widest mt-1">Full Organizational Node ({adminRoster.length})</p>
            )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {currentList.map((sheet) => (
                <div 
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet)}
                    className={cn(
                        "p-4 rounded-xl cursor-pointer transition-all duration-300 border",
                        selectedSheet?.id === sheet.id 
                            ? "bg-background border-primary-container shadow-sm"
                            : "hover:bg-surface-container-low border-transparent opacity-70"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary-container flex items-center justify-center font-black text-on-primary-container text-[10px] shadow-sm">
                            {sheet.user.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-headline text-xs font-black text-on-surface truncate leading-tight">{sheet.user.name}</p>
                            <p className="text-[9px] text-on-surface-variant font-bold truncate opacity-60 uppercase tracking-widest">CYCLE {sheet.cycleYear}</p>
                        </div>
                        <span className={cn(
                            "text-[7px] font-black uppercase tracking-widest", 
                            sheet.status === 'APPROVED' ? "text-[#4CAF50]" : "text-primary"
                        )}>
                            {sheet.status}
                        </span>
                    </div>
                </div>
            ))}
            {currentList.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center opacity-10">
                    <ArchiveIcon className="h-10 w-10 mb-4" />
                    <p className="text-[9px] font-bold uppercase tracking-widest">List Empty</p>
                </div>
            )}
        </div>
      </section>

      {/* Main Review Area */}
      <section className="flex-1 flex flex-col overflow-hidden relative p-6">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
        
        {selectedSheet ? (
            <div className="flex flex-col h-full relative z-10 space-y-4">
                <div className="flex justify-between items-end px-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-on-surface-variant mb-1 opacity-40">
                            <ArrowLeftIcon className="h-3 w-3" />
                            <span className="font-sans text-[9px] font-black uppercase tracking-[0.2em]">TEAM OVERVIEW</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="font-headline text-5xl font-black text-on-surface uppercase tracking-tighter leading-none text-primary">
                                {isAdmin ? "Verified Asset" : (isReadOnly ? "Verified Asset" : "Review & Pivot")}
                            </h1>
                            {isAutosaving && <div className="flex items-center gap-2 px-3 py-1 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-full text-[10px] font-black text-[#2E7D32] uppercase animate-pulse"><RefreshCwIcon className="h-3 w-3" /> Live Sync</div>}
                            {isReadOnly && <div className="flex items-center gap-2 px-3 py-1 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-full text-[10px] font-black text-[#2E7D32] uppercase"><ShieldCheckIcon className="h-4 w-4" /> Locked</div>}
                            {isAdmin && selectedSheet.status === 'APPROVED' && <div className="flex items-center gap-2 px-3 py-1 bg-[#FFBF00]/10 border border-[#FFBF00]/20 rounded-full text-[10px] font-black text-[#705E00] uppercase"><ShieldCheckIcon className="h-3 w-3" /> Approved</div>}
                        </div>
                        <p className="font-sans text-sm text-on-surface-variant font-bold mt-4">Operational targets for <span className="text-on-surface font-black underline decoration-primary decoration-4 underline-offset-4">{selectedSheet.user.name}</span></p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Quarter Selector */}
                        <div className="flex flex-col gap-2 mr-4">
                            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 ml-1">Review Segment</span>
                            <Select value={selectedQuarter} onValueChange={(val) => val && setSelectedQuarter(val)}>
                                <SelectTrigger className="w-48 bg-card border-outline-variant rounded-xl h-12 px-6 shadow-sm font-bold text-sm uppercase tracking-widest text-on-surface">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-outline-variant/40 shadow-xl">
                                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                                        <SelectItem key={q} value={q} className="font-bold text-xs py-3 uppercase tracking-wider">
                                            {q} Progress {q !== activeQuarter ? '(LOCKED)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3 mt-4">
                            {/* Unlock Button for Admin */}
                            {isAdmin && (selectedSheet.status === 'APPROVED' || selectedSheet.status === 'SUBMITTED') && (
                                <Button 
                                    variant="outline" 
                                    className="bg-card border-primary text-primary font-black uppercase text-[9px] tracking-widest h-12 px-6 rounded-xl shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                                    onClick={() => handleUnlock(selectedSheet.id)}
                                >
                                    <UnlockIcon className="h-3 w-3 mr-2" /> Unlock Strategy
                                </Button>
                            )}

                            {!isAdmin && !isReadOnly && (
                                <>
                                    <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
                                        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-outline-variant bg-card shadow-sm hover:bg-surface-container-low h-12 px-8">
                                            Request Revision
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">                                    <DialogHeader>
                                                <DialogTitle className="font-headline uppercase tracking-tight text-xl">Request Rework</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-6 space-y-4">
                                                <div className="space-y-3">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Manager Feedback</Label>
                                                    <Textarea 
                                                        placeholder="Explain what needs to be changed..." 
                                                        className="min-h-[140px] bg-surface-container-low border-none rounded-2xl p-6 text-base focus:ring-2 focus:ring-primary text-on-surface"
                                                        value={revisionComment}
                                                        onChange={(e) => setRevisionComment(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => setIsRevisionDialogOpen(false)} className="text-sm">Cancel</Button>
                                                <Button 
                                                    className="bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest px-8 h-12 rounded-xl" 
                                                    disabled={!revisionComment}
                                                    onClick={() => handleAction(selectedSheet.id, 'return')}
                                                >
                                                    Send Back
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <Button className="bg-primary text-primary-foreground font-black uppercase text-sm tracking-widest h-12 px-10 rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all" onClick={() => handleAction(selectedSheet.id, 'approve')}>Approve All</Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-card border border-outline-variant rounded-3xl shadow-lg">
                    <div className="px-8 py-5 border-b border-surface-container flex justify-between items-center bg-surface-bright/50 shrink-0">
                        <h4 className="font-headline text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">Strategic Performance Metrics</h4>
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                            <ActivityIcon className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Reviewing {selectedQuarter} Data</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface-container-low border-none">
                                    <TableHead className="px-8 py-3 font-black text-on-surface text-[10px] uppercase tracking-[0.2em] border-none w-1/4">Goal Details</TableHead>
                                    <TableHead className="px-8 py-3 font-black text-on-surface text-[10px] uppercase tracking-[0.2em] border-none text-center">Benchmark</TableHead>
                                    <TableHead className="px-8 py-3 font-black text-on-surface text-[10px] uppercase tracking-[0.2em] border-none text-center">Status</TableHead>
                                    <TableHead className="px-8 py-3 font-black text-on-surface text-[10px] uppercase tracking-[0.2em] border-none w-1/4">Quarterly Progress</TableHead>
                                    <TableHead className="px-8 py-3 font-black text-on-surface text-[10px] uppercase tracking-[0.2em] border-none text-right pr-12">Weightage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-surface-container">
                                {currentGoals.map((goal: any) => {
                                    const currentEdit = editData[goal.id] || goal;
                                    const checkIn = goal.checkIns?.find((c: any) => c.quarter === selectedQuarter);
                                    
                                    return (
                                        <TableRow key={goal.id} className="hover:bg-background transition-colors border-none group">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{currentEdit.thrustArea}</span>
                                                        <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest tracking-tighter">SLOT: {goal.id.slice(-4).toUpperCase()}</span>
                                                    </div>
                                                    <span className="font-headline text-lg font-black text-on-surface uppercase tracking-tight leading-tight">{currentEdit.title}</span>
                                                    <ExpandableText text={currentEdit.description} label="Project Scope" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-3">
                                                    <div className={cn("flex items-center border border-outline-variant rounded-xl bg-card px-3 py-1 shadow-sm min-w-[130px] justify-center transition-all", !isReadOnly && "focus-within:ring-2 focus-within:ring-primary")}>
                                                        {currentEdit.uom === 'TIMELINE' ? (
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="h-3 w-3 text-on-surface-variant opacity-40" />
                                                                <input 
                                                                    disabled={isReadOnly}
                                                                    type="date" 
                                                                    className={cn("font-headline text-xs font-black uppercase tracking-widest text-on-surface bg-transparent border-none p-0 text-center outline-none focus:ring-0", isReadOnly && "cursor-default")}
                                                                    value={currentEdit.deadline ? new Date(currentEdit.deadline).toISOString().split('T')[0] : ''}
                                                                    onChange={(e) => onFieldChange(goal.id, 'deadline', e.target.value)}
                                                                />
                                                            </div>
                                                        ) : currentEdit.uom === 'ZERO_BASED' ? (
                                                            <div className="flex items-center justify-center w-full">
                                                                <Select 
                                                                    disabled={isReadOnly} 
                                                                    value={currentEdit.target.toString()} 
                                                                    onValueChange={(val) => onFieldChange(goal.id, 'target', val)}
                                                                >
                                                                    <SelectTrigger className="bg-transparent border-none font-headline text-sm font-black text-on-surface h-8 px-2 shadow-none focus:ring-0">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                                                                        <SelectItem value="0" className="font-headline text-xs font-bold py-2 uppercase">0 (Zero-Incidents)</SelectItem>
                                                                        <SelectItem value="1" className="font-headline text-xs font-bold py-2 uppercase">1 (Binary Pass)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <input 
                                                                    disabled={isReadOnly}
                                                                    type="number" 
                                                                    className={cn("font-headline text-sm font-black uppercase tracking-widest text-on-surface w-14 bg-transparent border-none p-0 text-center outline-none focus:ring-0", isReadOnly && "cursor-default")}
                                                                    value={currentEdit.target}
                                                                    onChange={(e) => onFieldChange(goal.id, 'target', e.target.value)}
                                                                />
                                                                <span className="font-sans text-[10px] font-black uppercase text-on-surface-variant/40 ml-1">{goal.uom === 'PERCENTAGE' ? '%' : 'units'}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                    checkIn?.status === 'COMPLETED' ? "border-[#4CAF50] text-[#2E7D32] bg-[#4CAF50]/5" : 
                                                    checkIn?.status === 'ON_TRACK' ? "border-primary text-on-surface bg-primary/5" :
                                                    "border-on-surface-variant/20 text-on-surface-variant/40 bg-surface-container-low"
                                                )}>
                                                    {checkIn?.status || 'NOT_LOGGED'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col space-y-3">
                                                    <div className="flex items-end gap-2">
                                                        <span className="text-[10px] font-black text-primary">
                                                            {checkIn?.actualAchievement ?? 0}
                                                            <span className="ml-1 opacity-40">Achieved</span>
                                                        </span>
                                                        <span className="text-[8px] font-bold text-on-surface-variant/20 uppercase">/</span>
                                                        <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase">{goal.target} {goal.uom === 'PERCENTAGE' ? '%' : 'Units'}</span>
                                                    </div>
                                                    <ExpandableText text={checkIn?.employeeComment} label="Employee Commit Notes" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right pr-12">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <input 
                                                            disabled={isReadOnly}
                                                            type="number"
                                                            className={cn("font-headline text-lg font-black text-on-surface tracking-tighter w-12 bg-transparent border-none p-0 text-right outline-none focus:ring-0", isReadOnly && "cursor-default")}
                                                            value={currentEdit.weightage}
                                                            onChange={(e) => onFieldChange(goal.id, 'weightage', e.target.value)}
                                                        />
                                                        <span className="text-xs font-bold text-on-surface-variant/40">%</span>
                                                    </div>
                                                    <div className="h-1.5 w-32 bg-surface-container rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                                                        <div className="h-full bg-primary shadow-[0_0_8px_#ffd700]" style={{ width: `${currentEdit.weightage}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="px-8 py-5 bg-surface-bright flex justify-between items-center border-t border-surface-container shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-outline-variant shadow-sm">
                                     <CheckCircle2Icon className="h-6 w-6 text-[#4CAF50]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-60">TOTAL WEIGHTAGE:</span>
                                    <span className={cn("font-headline text-xl font-black tracking-tighter leading-none uppercase", totalWeightage === 100 ? "text-on-surface" : "text-error")}>
                                        {totalWeightage}% {totalWeightage === 100 ? '' : 'Error'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {!isReadOnly && !isAdmin && (
                            <div className="bg-secondary p-1.5 pl-6 rounded-2xl text-white flex items-center gap-8 shadow-xl border border-white/5">
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 whitespace-nowrap leading-none">Operational Status</p>
                                    <p className="text-[9px] font-black uppercase text-white tracking-widest mt-1 whitespace-nowrap leading-none">Ready to Commit</p>
                                </div>
                                <Button 
                                    className="bg-card text-on-surface-variant hover:bg-primary hover:text-primary-foreground font-black uppercase text-[9px] tracking-widest h-10 px-8 rounded-xl shadow-lg transition-all disabled:opacity-30" 
                                    onClick={() => handleAction(selectedSheet.id, 'approve')}
                                    disabled={totalWeightage !== 100}
                                >
                                    <SendIcon className="h-3.5 w-3.5 mr-2" /> Finalize Audit
                                </Button>
                            </div>
                        )}
                        {(isReadOnly || (isAdmin && selectedSheet.status === 'APPROVED')) && (
                            <div className="flex items-center gap-4 text-[#2E7D32]">
                                <p className="text-[10px] font-black uppercase tracking-widest">Audit Terminal Closed</p>
                                <ShieldCheckIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
                <UsersIcon className="h-16 w-16 text-on-surface-variant mb-4" />
                <p className="font-headline text-xl font-black uppercase tracking-tight">Queue Empty</p>
            </div>
        )}
      </section>
    </div>
  );
}