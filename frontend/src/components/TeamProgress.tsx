'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  UsersIcon, 
  BarChart3Icon, 
  MessageSquareIcon, 
  SearchIcon,
  TrendingUpIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  TargetIcon,
  ActivityIcon,
  ScaleIcon,
  CalendarIcon,
  LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function TeamProgress() {
  const { devMode } = useAuth();
  const [teamSheets, setTeamSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheetProgress, setSelectedSheetProgress] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [managerComments, setManagerComments] = useState<{ [key: string]: string }>({});

  const getActiveQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 4 && month <= 8) return 'Q1';
    if (month >= 9 && month <= 11) return 'Q2';
    if (month >= 0 && month <= 1) return 'Q3';
    return 'Q4';
  };

  const activeQuarter = getActiveQuarter();
  const [selectedQuarter, setSelectedQuarter] = useState(activeQuarter);

  const canEditQuarter = devMode || selectedQuarter === activeQuarter;

  useEffect(() => {
    loadTeamSheets();
  }, []);

  const loadTeamSheets = async () => {
    try {
      const data = await fetchApi('/goals/approved-subordinates');
      setTeamSheets(data);
      if (data.length > 0 && !selectedSheet) {
          viewProgress(data[0]);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewProgress = async (sheet: any) => {
    try {
      const data = await fetchApi(`/checkins/progress/${sheet.id}`);
      setSelectedSheetProgress(data);
      setSelectedSheet(sheet);
      
      const comments: any = {};
      data.forEach((p: any) => {
          const checkIn = p.checkIns?.find((c: any) => c.quarter === selectedQuarter);
          if (checkIn?.managerComment) comments[p.goalId] = checkIn.managerComment;
      });
      setManagerComments(comments);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleQuarterChange = (quarter: string) => {
      setSelectedQuarter(quarter);
      // Refresh comments for the new quarter
      const comments: any = {};
      selectedSheetProgress.forEach((p: any) => {
          const checkIn = p.checkIns?.find((c: any) => c.quarter === quarter);
          if (checkIn?.managerComment) comments[p.goalId] = checkIn.managerComment;
      });
      setManagerComments(comments);
  };

  const handleSaveComment = async (goalId: string, comment: string) => {
      if (!canEditQuarter) return;
      try {
          await fetchApi('/checkins/quarterly-feedback', {
              method: 'PUT',
              body: JSON.stringify({
                  goalId,
                  quarter: selectedQuarter,
                  managerComment: comment
              })
          });
          toast.success('Engineering feedback synchronized');
      } catch (error: any) {
          toast.error(error.message);
      }
  };

  if (loading) return <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase">Initializing...</div>;

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      
      {/* Team Member Sidebar */}
      <section className="w-80 border-r border-outline-variant bg-card flex flex-col shrink-0">
        <div className="p-8 border-b border-outline-variant bg-surface-bright">
            <h3 className="font-headline text-xl font-black uppercase tracking-tight text-on-surface">Team Performance</h3>
            <p className="font-sans text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-[0.3em] mt-2">{teamSheets.length} Active Nodes</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {teamSheets.map((sheet) => (
                <div 
                    key={sheet.id}
                    onClick={() => viewProgress(sheet)}
                    className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all duration-300 border",
                        selectedSheet?.id === sheet.id 
                            ? "bg-background border-primary-container shadow-sm" 
                            : "hover:bg-surface-container-low border-transparent opacity-70"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary-container flex items-center justify-center font-black text-on-primary-container text-xs shadow-sm">
                            {sheet.user.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-headline text-sm font-black text-on-surface truncate leading-tight">{sheet.user.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-bold truncate opacity-60 uppercase tracking-widest mt-1">Cycle {sheet.cycleYear}</p>
                        </div>
                        <ChevronRightIcon className={cn("h-4 w-4 text-primary transition-transform", selectedSheet?.id === sheet.id ? "rotate-90" : "opacity-20")} />
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Main Analysis Area */}
      <section className="flex-1 flex flex-col overflow-hidden relative p-8">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
        
        {selectedSheet ? (
            <div className="flex flex-col h-full relative z-10 space-y-8">
                {/* Profile Header */}
                <div className="flex justify-between items-end px-2">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[2rem] bg-secondary flex items-center justify-center shadow-xl border-4 border-white">
                             <span className="font-headline text-3xl font-black text-white">{selectedSheet.user.name[0]}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-on-surface-variant mb-1 opacity-40">
                                <ActivityIcon className="h-3 w-3" />
                                <span className="font-sans text-[10px] font-black uppercase tracking-[0.3em]">LIVE PERFORMANCE TELEMETRY</span>
                            </div>
                            <h1 className="font-headline text-4xl font-black text-on-surface uppercase tracking-tighter leading-none">{selectedSheet.user.name}</h1>
                            <p className="font-sans text-xs text-on-surface-variant font-bold mt-2 uppercase tracking-widest opacity-60">{selectedSheet.user.role} // {selectedSheet.user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <Select value={selectedQuarter} onValueChange={(val) => val && handleQuarterChange(val)}>
                            <SelectTrigger className="w-48 bg-card border-outline-variant rounded-xl h-12 px-6 shadow-sm font-bold text-sm uppercase tracking-widest text-on-surface">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-outline-variant/40 shadow-xl">
                                {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                                    <SelectItem key={q} value={q} className="font-bold text-xs py-3 uppercase tracking-wider">
                                        {q} Review {q !== activeQuarter ? '(LOCKED)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="bg-card border border-outline-variant rounded-2xl p-4 px-8 shadow-sm flex flex-col items-center justify-center">
                             <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40 mb-1">AGGREGATE SCORE</span>
                             <span className="font-headline text-4xl font-black text-primary tracking-tighter">8.4</span>
                        </div>
                    </div>
                </div>

                {/* Metrics Matrix */}
                <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {selectedSheetProgress.map((p) => (
                            <div key={p.goalId} className="bg-card border border-outline-variant rounded-[2.5rem] p-10 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <TargetIcon className="h-32 w-32" />
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    {!canEditQuarter && (
                                        <div className="absolute inset-[-40px] bg-background/20 backdrop-blur-[1px] z-50 rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                                            <div className="bg-card/90 p-4 rounded-xl border border-outline-variant shadow-lg flex items-center gap-3">
                                                <LockIcon className="h-4 w-4 text-on-surface-variant opacity-40" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Read Only Mode</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{p.uom}</span>
                                                <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Weightage: {p.weightage}%</span>
                                            </div>
                                            <h4 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight leading-tight mb-2">{p.title}</h4>
                                            <div className="flex items-center gap-6 mt-4">
                                                <div className="flex flex-col border-r border-outline-variant/30 pr-6">
                                                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Benchmark</span>
                                                    <span className="font-headline text-lg font-black text-on-surface">{p.target} <span className="text-[10px] opacity-30">{p.uom}</span></span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live Achievement</span>
                                                    <span className="font-headline text-lg font-black text-on-surface">
                                                        {p.checkIns?.find((c: any) => c.quarter === selectedQuarter)?.actualAchievement ?? 0} 
                                                        <span className="text-[10px] opacity-30"> {p.uom === 'PERCENTAGE' || p.uom === 'ZERO_BASED' || p.uom === 'TIMELINE' ? '%' : p.uom}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "font-headline text-5xl font-black tracking-tighter leading-none",
                                                p.score >= 100 ? "text-[#4CAF50]" : p.score > 0 ? "text-primary" : "text-error"
                                            )}>
                                                {p.score.toFixed(0)}%
                                            </span>
                                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-2">Achieved</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8 mt-auto">
                                        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    p.score >= 100 ? "bg-[#4CAF50] shadow-[0_0_12px_#4caf50]" : "bg-primary shadow-[0_0_12px_#ffd700]"
                                                )} 
                                                style={{ width: `${Math.min(100, p.score)}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0 border border-outline-variant/30">
                                                    <MessageSquareIcon className="h-5 w-5 text-on-surface-variant" />
                                                </div>
                                                <div className="flex-1 relative group/input">
                                                    <input 
                                                        disabled={!canEditQuarter}
                                                        value={managerComments[p.goalId] || ''}
                                                        onChange={(e) => setManagerComments({...managerComments, [p.goalId]: e.target.value})}
                                                        onBlur={(e) => handleSaveComment(p.goalId, e.target.value)}
                                                        placeholder={canEditQuarter ? "Add structured engineering feedback..." : "Read-only feedback archive"} 
                                                        className="w-full bg-surface-container-low border-none rounded-xl h-12 px-5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Analysis */}
                <div className="px-10 py-8 bg-secondary rounded-[3rem] text-white flex justify-between items-center shadow-2xl border border-white/10 shrink-0">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-card/10 rounded-2xl flex items-center justify-center border border-white/10">
                                 <TrendingUpIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">PERFORMANCE TRAJECTORY</span>
                                <span className="font-headline text-2xl font-black text-white tracking-tighter mt-1">+12.4% INCREASE <span className="text-sm opacity-30 font-sans ml-2">Vs LAST QUARTER</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <Button className="bg-card text-on-surface-variant hover:bg-primary hover:text-primary-foreground font-black uppercase text-xs tracking-widest h-14 px-12 rounded-2xl shadow-lg transition-all">
                        <ShieldCheckIcon className="h-5 w-5 mr-3" /> Finalize Quarterly Audit
                    </Button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
                <BarChart3Icon className="h-24 w-24 text-on-surface-variant mb-6" />
                <p className="font-headline text-2xl font-black uppercase tracking-widest">Awaiting Technical Roster</p>
            </div>
        )}
      </section>
    </div>
  );
}