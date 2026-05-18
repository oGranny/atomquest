'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  TargetIcon, 
  UsersIcon,
  ShieldCheckIcon,
  ActivityIcon,
  ArrowUpRightIcon,
  PieChartIcon,
  RefreshCwIcon,
  ScaleIcon,
  TrophyIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [distribution, setDistribution] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [distData, trendData, managerData] = await Promise.all([
        fetchApi('/analytics/distribution'),
        fetchApi('/analytics/trends'),
        fetchApi('/analytics/managers')
      ]);
      setDistribution(distData);
      setTrends(trendData);
      setManagers(managerData);
    } catch (error: any) {
      toast.error('Failed to calibrate analytics engine.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase">Syncing...</div>;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <Header title="Strategic Analytics" />
      
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
        <div className="max-w-[1440px] mx-auto w-full space-y-8 relative z-10">
          
          <header className="flex justify-between items-end mb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">
                    <ActivityIcon className="h-3 w-3" /> Live Data Aggregation
                </div>
                <h1 className="font-headline text-5xl font-black text-on-surface uppercase tracking-tighter leading-none">Organizational Insights</h1>
              </div>
              <Button onClick={loadAnalytics} variant="outline" className="h-12 border-outline-variant bg-card text-on-surface font-bold uppercase text-[10px] tracking-widest px-6 rounded-xl hover:bg-surface-container-low transition-all">
                  <RefreshCwIcon className="h-4 w-4 mr-2" /> Refresh Telemetry
              </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* QoQ Trends Histogram */}
              <Card className="lg:col-span-2 rounded-[2.5rem] shadow-2xl border border-outline-variant/40 bg-card overflow-hidden">
                  <div className="p-8 border-b border-surface-container flex justify-between items-center bg-surface-bright/50">
                      <div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">QoQ Performance Trend</h3>
                        <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-40 mt-1">Aggregate Precision Index Trajectory</p>
                      </div>
                      <TrendingUpIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardContent className="p-10">
                      <div className="h-[300px] flex items-end justify-around gap-4 pb-8 border-b border-outline-variant/20 relative">
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                              {[100, 75, 50, 25, 0].map(val => (
                                  <div key={val} className="w-full border-t border-outline-variant/5 flex items-center">
                                      <span className="text-[8px] font-bold text-on-surface-variant/20 ml-[-24px]">{val}%</span>
                                  </div>
                              ))}
                          </div>
                          {trends.map((t, idx) => (
                              <div key={t.quarter} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                  <div className="text-[10px] font-black text-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-[-30px]">
                                      {t.score.toFixed(1)}%
                                  </div>
                                  <div 
                                    className="w-full max-w-[80px] bg-primary rounded-t-xl transition-all duration-1000 shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:brightness-110 cursor-help"
                                    style={{ height: `${t.score}%`, opacity: 0.3 + (idx * 0.2) }}
                                  ></div>
                                  <span className="font-headline text-xs font-black text-on-surface mt-4 uppercase tracking-widest">{t.quarter}</span>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>

              {/* Status Breakdown Circular Metric */}
              <Card className="rounded-[2.5rem] shadow-2xl border border-outline-variant/40 bg-card overflow-hidden">
                <div className="p-8 border-b border-surface-container flex justify-between items-center bg-surface-bright/50">
                    <div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface uppercase tracking-tight">Cycle Health</h3>
                        <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-40 mt-1">Strategy Maturity Matrix</p>
                    </div>
                    <PieChartIcon className="h-6 w-6 text-primary" />
                </div>
                <CardContent className="p-10 space-y-8">
                    {Object.entries(distribution?.statuses || {}).map(([status, count]: any) => {
                        const percent = ((count / (distribution?.totalGoals || 1)) * 100).toFixed(0);
                        return (
                            <div key={status} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{status}</span>
                                    <span className="font-headline text-xl font-black text-on-surface">{percent}% <span className="text-[9px] text-on-surface-variant/40">({count} sheets)</span></span>
                                </div>
                                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            status === 'APPROVED' ? "bg-[#4CAF50]" : status === 'SUBMITTED' ? "bg-primary" : "bg-on-surface-variant/20"
                                        )}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Manager Effectiveness Terminal */}
              <Card className="rounded-[2.5rem] shadow-2xl border border-outline-variant/40 bg-card overflow-hidden">
                  <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                             <TrophyIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">Audit Compliance Leaderboard</h3>
                            <p className="font-sans text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.3em] opacity-40 mt-1">L1 Manager Check-in Engagement Rate</p>
                        </div>
                      </div>
                  </div>
                  <div className="overflow-hidden">
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-surface-container-low border-none h-12">
                                  <TableHead className="px-8 font-black text-[9px] uppercase tracking-widest text-on-surface-variant/60">Rank / Manager</TableHead>
                                  <TableHead className="px-8 font-black text-[9px] uppercase tracking-widest text-on-surface-variant/60 text-center">Nodes</TableHead>
                                  <TableHead className="px-8 font-black text-[9px] uppercase tracking-widest text-on-surface-variant/60 text-right">Audit Rate</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-surface-container">
                              {managers.map((m, idx) => (
                                  <TableRow key={m.id} className="hover:bg-surface-container-low transition-colors h-16 group">
                                      <td className="px-8">
                                          <div className="flex items-center gap-4">
                                              <span className="font-headline text-lg font-black text-on-surface-variant/20 group-hover:text-primary transition-colors">#{idx + 1}</span>
                                              <div className="flex flex-col">
                                                  <span className="font-headline text-sm font-black text-on-surface uppercase">{m.name}</span>
                                                  <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">{m.email}</span>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-8 text-center">
                                          <span className="text-xs font-black text-on-surface">{m.totalSubordinates}</span>
                                      </td>
                                      <td className="px-8 text-right">
                                          <div className="flex flex-col items-end">
                                              <span className={cn(
                                                  "font-headline text-lg font-black tracking-tighter",
                                                  m.auditRate >= 80 ? "text-[#4CAF50]" : m.auditRate >= 50 ? "text-primary" : "text-error"
                                              )}>{m.auditRate.toFixed(0)}%</span>
                                              <div className="w-24 h-1 bg-surface-container rounded-full mt-1 overflow-hidden">
                                                  <div className="h-full bg-current" style={{ width: `${m.auditRate}%` }}></div>
                                              </div>
                                          </div>
                                      </td>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </Card>

              {/* Goal Distribution Matrix */}
              <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-8 rounded-[2rem] shadow-xl border border-outline-variant/40 bg-card relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                              <TargetIcon className="h-20 w-20" />
                          </div>
                          <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 mb-6">Thrust Area Focus</h4>
                          <div className="space-y-4">
                              {Object.entries(distribution?.thrustAreas || {}).sort((a:any, b:any) => b[1] - a[1]).slice(0, 4).map(([area, count]: any) => (
                                  <div key={area} className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-on-surface uppercase truncate max-w-[150px]">{area}</span>
                                      <div className="flex items-center gap-3">
                                          <div className="h-1.5 w-24 bg-surface-container rounded-full overflow-hidden">
                                              <div className="h-full bg-primary" style={{ width: `${(count / distribution.totalGoals) * 100}%` }}></div>
                                          </div>
                                          <span className="text-xs font-black text-on-surface w-6 text-right">{count}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </Card>

                      <Card className="p-8 rounded-[2rem] shadow-xl border border-outline-variant/40 bg-card relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                              <ScaleIcon className="h-20 w-20" />
                          </div>
                          <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 mb-6">Unit of Measurement</h4>
                          <div className="space-y-4">
                              {Object.entries(distribution?.uomTypes || {}).map(([uom, count]: any) => (
                                  <div key={uom} className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-on-surface uppercase">{uom}</span>
                                      <span className="font-headline text-base font-black text-primary">{count} <span className="text-[8px] text-on-surface-variant/40 ml-1">SLOTS</span></span>
                                  </div>
                              ))}
                          </div>
                      </Card>
                  </div>

                  {/* <Card className="bg-secondary text-white p-8 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 blueprint-grid opacity-[0.05] pointer-events-none"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <ShieldCheckIcon className="h-10 w-10 text-primary mb-6 drop-shadow-[0_0_10px_#ffd700]" />
                                <h4 className="font-headline text-2xl font-black mb-4 uppercase tracking-tighter leading-none">Strategic Alignment Index</h4>
                                <div className="mt-6 font-sans text-sm font-medium opacity-80 leading-relaxed italic border-l-2 border-primary/30 pl-6">
                                    {distribution && managers.length > 0 && (
                                        <p>
                                            NODE SYNC: Organizational strategy is currently optimized for <span className="text-primary font-black not-italic">{Object.entries(distribution.thrustAreas).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'}</span> with an aggregate management audit compliance of <span className="text-primary font-black not-italic">{(managers.reduce((sum, m) => sum + m.auditRate, 0) / managers.length).toFixed(0)}%</span>.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" className="text-primary hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest p-0 justify-start w-fit mt-8 relative z-10 group-hover:translate-x-2 transition-all">
                                Download Audit Log <ArrowUpRightIcon className="h-4 w-4 ml-3" />
                            </Button>
                        </div>
                  </Card> */}
              </div>

          </div>

        </div>
      </div>
    </div>
  );
}