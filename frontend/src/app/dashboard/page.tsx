'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { 
  ArrowRightIcon, 
  TrendingUpIcon, 
  AlertCircleIcon, 
  DownloadIcon, 
  FilterIcon,
  ActivityIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  MinusIcon,
  MessageCircleIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Logical Scoring Engine (Aligned with BRD Phase 2)
const calculateGoalScore = (goal: any, quarter: string) => {
    const checkIn = goal.checkIns?.find((c: any) => c.quarter === quarter);
    if (!checkIn) return 0;

    const actual = checkIn.actualAchievement ?? 0;
    const target = goal.target;

    switch (goal.uom) {
        case 'NUMERIC':
        case 'PERCENTAGE':
            if (goal.direction === 'HIGHER_IS_BETTER') {
                return target === 0 ? 0 : (actual / target) * 100;
            } else {
                // Max (Lower is Better) Formula: Target / Achievement
                return actual === 0 ? 100 : (target / actual) * 100;
            }
        case 'ZERO_BASED':
        case 'TIMELINE':
            return Math.min(100, Math.max(0, actual));
        default:
            return 0;
    }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [goalSheets, setGoalSheets] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');

  useEffect(() => {
    if (user) loadGoalSheets();
  }, [user]);

  const loadGoalSheets = async () => {
    try {
      const data = await fetchApi('/goals/my-sheets');
      setGoalSheets(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFetching(false);
    }
  };

  if (!user) return null;

  const currentSheet = goalSheets.find(s => s.cycleYear === 2026);

  // Global Performance Aggregate
  const globalScore = currentSheet?.goals.length > 0 
    ? currentSheet.goals.reduce((sum: number, g: any) => sum + (calculateGoalScore(g, selectedQuarter) * (g.weightage / 100)), 0)
    : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <Header title="Success Dashboard" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.04]"></div>
        <div className="max-w-[1440px] mx-auto w-full space-y-12 relative z-10">
          
          {/* Hero Stats Bento */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 bg-card p-10 rounded-2xl shadow-level-1 border border-outline-variant flex flex-col justify-between overflow-hidden relative">
              <div className="z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-container/10 border border-primary-container/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">
                  <ActivityIcon className="h-3 w-3" /> Live Precision Analysis
                </div>
                <h2 className="font-headline text-4xl font-black text-on-surface mb-4 tracking-tighter uppercase">Quarterly Achievement</h2>
                <p className="font-sans text-lg text-on-surface-variant max-w-lg leading-relaxed opacity-70">
                  Precision tracking for <span className="font-black text-primary underline underline-offset-4 decoration-primary/30">{selectedQuarter}</span> is active. 
                  Your aggregate performance across all strategic objectives is currently <span className="text-on-surface font-black">{globalScore.toFixed(1)}%</span>.
                </p>
              </div>
              <div className="flex items-end gap-6 mt-12 z-10">
                {/* <Button className="bg-primary text-primary-foreground font-black px-10 h-14 shadow-lg hover:brightness-105 active:scale-[0.98] transition-all rounded-xl uppercase text-[10px] tracking-widest">
                  <DownloadIcon className="h-4 w-4 mr-3" /> Generate Audit Report
                </Button> */}
                <Button variant="outline" className="border-outline-variant bg-card text-on-surface font-bold h-14 px-8 hover:bg-surface-container-low rounded-xl uppercase text-[10px] tracking-widest" onClick={() => router.push('/dashboard/builder')}>
                  Strategy Builder
                </Button>
              </div>
              <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                 <TrendingUpIcon className="h-96 w-96 text-on-surface" />
              </div>
            </div>
            
            <div className="md:col-span-4 bg-secondary text-white p-12 rounded-[3rem] shadow-2xl flex flex-col justify-center items-center text-center group border-b-8 border-primary relative overflow-hidden">
                <div className="absolute inset-0 blueprint-grid opacity-[0.05]"></div>
                <div className="relative z-10">
                    <div className="text-[120px] font-headline font-black text-primary leading-none mb-4 drop-shadow-[0_10px_20px_rgba(255,215,0,0.3)] group-hover:scale-110 transition-transform">
                        {Math.round(globalScore)}<span className="text-4xl text-primary/40">%</span>
                    </div>
                    <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-[#c0c6db] opacity-60">Aggregate Performance Index</p>
                    <div className="mt-12 h-2 w-48 bg-card/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div 
                            className="h-full bg-primary shadow-[0_0_15px_#ffd700] transition-all duration-1000" 
                            style={{ width: `${globalScore}%` }}
                        ></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between">
              <h3 className="font-headline text-3xl font-black text-on-surface flex items-center gap-4 uppercase tracking-tighter">
                  <div className="w-2 h-10 bg-primary rounded-full shadow-[0_0_10px_#ffd700]"></div>
                  Strategic Objective Telemetry
              </h3>
              <div className="flex items-center gap-6">
                  <Select value={selectedQuarter} onValueChange={val => val && setSelectedQuarter(val)}>
                      <SelectTrigger className="glass-status border-outline-variant text-on-surface-variant text-[10px] font-black uppercase h-10 px-6 hover:bg-card shadow-sm w-48 rounded-xl">
                          <SelectValue placeholder="Quarter" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                          <SelectItem value="Q1" className="font-bold text-xs py-3 uppercase">Q1 (July Update)</SelectItem>
                          <SelectItem value="Q2" className="font-bold text-xs py-3 uppercase">Q2 (Oct Update)</SelectItem>
                          <SelectItem value="Q3" className="font-bold text-xs py-3 uppercase">Q3 (Jan Update)</SelectItem>
                          <SelectItem value="Q4" className="font-bold text-xs py-3 uppercase">Q4 (Annual Audit)</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button variant="ghost" className="text-primary font-black hover:bg-secondary bg-secondary px-6 h-10 rounded-xl uppercase text-[10px] tracking-widest shadow-lg transition-all" onClick={() => router.push('/dashboard/builder')}>
                      Timeline <ArrowRightIcon className="ml-3 h-4 w-4" />
                  </Button>
              </div>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-80 bg-surface-container rounded-2xl border border-outline-variant"></div>)}
            </div>
          ) : !currentSheet || currentSheet.goals.length === 0 ? (
            <Card className="shadow-level-1 border-dashed border-2 rounded-2xl bg-card/50">
              <CardContent className="p-32 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-surface-container-low rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                    <AlertCircleIcon className="h-10 w-10 text-on-surface-variant opacity-20" />
                </div>
                <p className="text-on-surface font-black text-2xl mb-3 tracking-tight">No active objectives detected.</p>
                <p className="text-on-surface-variant text-base mb-10 max-w-sm opacity-70">
                    Initialize your goal sheet for Cycle 2026 to start tracking performance metrics.
                </p>
                <Button className="bg-primary text-primary-foreground font-black px-12 h-14 rounded-xl shadow-xl hover:brightness-105 active:scale-95 transition-all" onClick={() => router.push('/dashboard/builder')}>
                    Initialize Builder Engine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {currentSheet.goals.map((goal: any) => {
                const currentScore = calculateGoalScore(goal, selectedQuarter);
                const checkIn = goal.checkIns?.find((c: any) => c.quarter === selectedQuarter);

                return (
                  <Card key={goal.id} className="rounded-[3rem] bg-card shadow-level-1 border border-outline-variant/40 hover:shadow-level-2 transition-all group cursor-pointer overflow-hidden flex flex-col h-[480px]" onClick={() => router.push(`/dashboard/sheet/${currentSheet.id}`)}>
                    
                    <div className="p-10 flex flex-col flex-1">
                        {/* Top Info Bar */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">NODE: {goal.id.slice(-4).toUpperCase()}</p>
                                <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest bg-surface-container-low px-2 py-0.5 rounded">{goal.thrustArea}</span>
                            </div>
                            <div className={cn(
                            "glass-status px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
                            checkIn?.status === 'COMPLETED' ? "border-[#4CAF50] text-[#2E7D32]" : "border-primary text-primary bg-card"
                            )}>
                                {checkIn?.status || 'NOT_STARTED'}
                            </div>
                        </div>
                        
                        {/* Title Area */}
                        <div className="mb-8">
                            <h4 className="font-headline text-3xl font-black text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2 uppercase tracking-tighter">{goal.title}</h4>
                        </div>

                        {/* Progress Visuals */}
                        <div className="flex flex-col items-center justify-center space-y-8 mt-auto">
                            <div 
                                className="circular-progress w-[140px] h-[140px] rounded-full flex items-center justify-center relative shadow-xl border-8 border-surface-container-low shrink-0" 
                                style={{'--progress': `${Math.min(100, currentScore)}%`} as any}
                            >
                                <div className="text-center">
                                    <span className="font-headline text-4xl font-black text-on-surface tracking-tighter leading-none">{Math.round(currentScore)}%</span>
                                    <p className="text-[9px] font-black text-on-surface-variant uppercase opacity-40 mt-1">Completed</p>
                                </div>
                            </div>
                            
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                                    <span>Achievement Log</span>
                                    <span>Target: {goal.target} {goal.uom}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-secondary uppercase opacity-40">Current Achievement</span>
                                        <span className="font-headline text-xl font-black text-on-surface">
                                            {checkIn?.actualAchievement ?? 0} {goal.uom === 'PERCENTAGE' || goal.uom === 'ZERO_BASED' || goal.uom === 'TIMELINE' ? '%' : goal.uom}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-bold text-secondary uppercase opacity-40">Variance</span>
                                        <p className={cn("text-xs font-black", currentScore >= 100 ? "text-[#4CAF50]" : "text-error")}>
                                            {currentScore >= 100 ? 'ON TRACK' : `-${(100 - currentScore).toFixed(1)}%`}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            currentScore >= 100 ? "bg-[#4CAF50]" : "bg-primary"
                                        )} 
                                        style={{ width: `${Math.min(100, currentScore)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manager Feedback Component */}
                    {checkIn?.managerComment && (
                        <div className="px-10 py-4 bg-primary/5 border-y border-primary/10 flex items-start gap-4">
                            <MessageCircleIcon className="h-4 w-4 text-primary shrink-0 mt-1" />
                            <p className="text-[11px] font-medium text-on-surface-variant leading-relaxed italic line-clamp-2">
                                "{checkIn.managerComment}"
                            </p>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="px-10 py-6 border-t border-outline-variant/30 flex justify-between items-center relative bg-surface-bright shrink-0">
                        <div className="flex flex-col">
                          <span className="font-sans text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mb-1">Metric Type</span>
                          <span className="font-headline text-lg font-black text-on-surface tracking-tighter uppercase">
                            {goal.uom} // {goal.direction?.replace('_IS_BETTER', '')}
                          </span>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-card border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                            <ArrowRightIcon className="h-5 w-5 text-on-surface-variant group-hover:text-white transition-colors" />
                        </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}