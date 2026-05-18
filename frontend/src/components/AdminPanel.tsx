'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  TrendingUpIcon, 
  ShieldCheckIcon, 
  LayoutGridIcon, 
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  FileSpreadsheetIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  TargetIcon,
  MessageSquareIcon,
  DownloadIcon,
  CalendarIcon,
  AlertCircleIcon,
  LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [escalationLogs, setEscalationLogs] = useState<any[]>([]);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [adminRoster, setAdminRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  
  // Pagination States
  const [auditPage, setAuditPage] = useState(1);
  const [escalationPage, setEscalationPage] = useState(1);
  const logsPerPage = 6;

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsData, auditData, escalationData, deptData, rosterData] = await Promise.all([
        fetchApi('/reports/completion'),
        fetchApi('/reports/audit'),
        fetchApi('/reports/escalations'),
        fetchApi('/reports/departmental-stats'),
        fetchApi('/goals/admin-roster')
      ]);
      setStats(statsData);
      setAuditLogs(auditData);
      setEscalationLogs(escalationData);
      setDeptStats(deptData);
      setAdminRoster(rosterData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const data = await fetchApi('/reports/achievement');
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Employee,Email,Cycle,Goal,Target,Weightage,LatestActual,Status\n"
        + data.map((r: any) => Object.values(r).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "achievement_report.csv");
      document.body.appendChild(link);
      link.click();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const downloadNodeReport = (sheet: any) => {
      const data = sheet.goals.map((goal: any) => {
          const latest = goal.checkIns?.[goal.checkIns.length - 1];
          return {
              Employee: sheet.user.name,
              Email: sheet.user.email,
              ThrustArea: goal.thrustArea,
              Goal: goal.title,
              Target: goal.target,
              UoM: goal.uom,
              Achievement: latest?.actualAchievement ?? 0,
              Status: latest?.status ?? 'N/A',
              Comments: latest?.employeeComment ?? ''
          };
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + "Employee,Email,ThrustArea,Goal,Target,UoM,Achievement,Status,Comments\n"
        + data.map((r: any) => Object.values(r).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${sheet.user.name.replace(/\s+/g, '_')}_goals.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const handleNodeClick = (empId: string) => {
      const sheet = adminRoster.find(s => s.userId === empId);
      if (sheet) {
          setSelectedNode(sheet);
          setIsNodeModalOpen(true);
      } else {
          toast.error("No active technical strategy found for this node.");
      }
  };

  if (loading) return <div className="p-20 text-center font-headline text-xl text-primary animate-pulse tracking-widest uppercase bg-background min-h-screen">Initializing Governance Page...</div>;

  // Pagination Helper
  const getPagedData = (data: any[], page: number) => {
      const last = page * logsPerPage;
      const first = last - logsPerPage;
      return {
          current: data.slice(first, last),
          total: Math.ceil(data.length / logsPerPage)
      };
  };

  const pagedAudit = getPagedData(auditLogs, auditPage);
  const pagedEscalation = getPagedData(escalationLogs, escalationPage);

  return (
    <div className="space-y-6 pb-12">
      <header className="px-2">
          <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.4em] opacity-60">SYSTEM GOVERNANCE TERMINAL</span>
          </div>
          <h1 className="font-headline text-3xl font-black text-on-surface uppercase tracking-tighter leading-none">Governance Heatmap</h1>
          <p className="text-on-surface-variant font-sans text-sm font-medium mt-2 opacity-60 max-w-2xl leading-relaxed">Real-time departmental alignment and organizational goal completion oversight.</p>
      </header>

      {/* Top Section: Gauges */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 rounded-2xl shadow-lg border-outline-variant/40 bg-card flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
              <div className="w-full border-b border-outline-variant/10 pb-4 mb-6">
                  <h3 className="font-headline text-sm font-black text-on-surface uppercase tracking-tight">Quarterly Check-in Status ({stats?.activeQuarter || 'N/A'})</h3>
              </div>
              <div className="relative flex items-center justify-center w-48 h-24 overflow-hidden">
                  <div className="absolute top-0 w-48 h-48 border-[16px] border-surface-container rounded-full opacity-30"></div>
                  <div 
                    className="absolute top-0 w-48 h-48 border-[16px] border-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_#ffd700]" 
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: `rotate(${((stats?.checkInRate || 0) * 1.8) - 180}deg)` }}
                  ></div>
                  <div className="absolute bottom-0 flex flex-col items-center pb-1">
                      <span className="font-headline text-3xl font-black text-on-surface leading-none tracking-tighter">{stats?.checkedInCount || 0}/{stats?.totalParticipants || 0}</span>
                      <span className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1 opacity-40">Active Logins</span>
                  </div>
              </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg border-outline-variant/40 bg-card flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary/20"></div>
              <div className="w-full border-b border-outline-variant/10 pb-4 mb-6">
                  <h3 className="font-headline text-sm font-black text-on-surface uppercase tracking-tight">Organizational Precision Index</h3>
              </div>
              <div className="relative flex items-center justify-center w-48 h-24 overflow-hidden">
                  <div className="absolute top-0 w-48 h-48 border-[16px] border-surface-container rounded-full opacity-30"></div>
                  <div 
                    className="absolute top-0 w-48 h-48 border-[16px] border-secondary rounded-full transition-all duration-1000 shadow-[0_0_15px_#141b2b]" 
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: `rotate(${((stats?.overallAchievement || 0) * 1.8) - 180}deg)` }}
                  ></div>
                  <div className="absolute bottom-0 flex flex-col items-center pb-1">
                      <span className="font-headline text-3xl font-black text-on-surface leading-none tracking-tighter">{Math.round(stats?.overallAchievement || 0)}%</span>
                      <span className="font-sans text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1 opacity-40">Aggregate Completion</span>
                  </div>
              </div>
          </Card>
      </section>

      {/* Heatmap Section */}
      <Card className="p-6 rounded-2xl shadow-lg border-outline-variant/40 bg-card relative overflow-hidden">
          <div className="absolute inset-0 blueprint-grid opacity-[0.02] pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-outline-variant/10 pb-4 relative z-10">
              <div>
                  <h2 className="font-headline text-xl font-black text-on-surface uppercase tracking-tighter">Departmental Status Matrix</h2>
              </div>
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
                      <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_#ffd700]"></span>
                      <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Stalled</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-on-surface-variant/20 rounded-full"></span>
                      <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Inactive</span>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative z-10">
              {deptStats.map((emp) => (
                  <div 
                    key={emp.id} 
                    onClick={() => handleNodeClick(emp.id)}
                    className="bg-surface-container-low p-4 rounded-xl border border-outline-variant hover:border-primary transition-all group cursor-pointer shadow-sm relative overflow-hidden flex flex-col h-full"
                  >
                      <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                              <div className="h-8 w-8 rounded-lg bg-card border border-outline-variant/40 flex items-center justify-center shadow-inner group-hover:bg-primary transition-colors">
                                  <ActivityIcon className={cn(
                                      "h-4 w-4 group-hover:text-primary-foreground transition-colors",
                                      emp.status === 'APPROVED' ? "text-emerald-500" : emp.status === 'SUBMITTED' ? "text-primary" : "text-on-surface-variant/30"
                                  )} />
                              </div>
                              <span className={cn(
                                "glass-status border px-2 py-0.5 rounded-full font-black text-[7px] uppercase tracking-[0.2em] shadow-sm",
                                emp.status === 'APPROVED' ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5" : emp.status === 'SUBMITTED' ? "border-primary/20 text-primary bg-primary/5" : "border-outline-variant/10 text-on-surface-variant/30 bg-surface-container-low"
                              )}>
                                 {emp.status === 'APPROVED' ? "Optimal" : emp.status === 'SUBMITTED' ? "Pending" : "Inactive"}
                              </span>
                          </div>

                          <div className="space-y-0.5 mb-6">
                              <p className="font-headline text-sm font-black text-on-surface uppercase tracking-tight truncate leading-tight">{emp.name}</p>
                              <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-40 truncate">{emp.department || 'Strategic Unit'}</p>
                          </div>

                          <div className="mt-auto bg-card/50 rounded-xl p-3 border border-outline-variant/20 shadow-inner">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Precision</span>
                                  <span className={cn(
                                      "font-headline text-base font-black tracking-tighter",
                                      emp.score >= 80 ? "text-[#4CAF50]" : emp.score >= 50 ? "text-primary" : "text-error"
                                  )}>
                                      {Math.round(emp.score)}%
                                  </span>
                              </div>
                              <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                                  <div 
                                      className={cn(
                                          "h-full transition-all duration-1000",
                                          emp.score >= 80 ? "bg-[#4CAF50]" : "bg-primary"
                                      )} 
                                      style={{ width: `${Math.min(100, emp.score)}%` }}
                                  ></div>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
              <p className="text-[10px] text-on-surface-variant italic font-medium opacity-40 tracking-wide">Last global synchronization performed moments ago.</p>
              <Button onClick={downloadReport} className="bg-secondary text-white font-black uppercase text-[9px] tracking-[0.1em] h-10 px-6 rounded-lg shadow-md hover:bg-black transition-all">
                  <FileSpreadsheetIcon className="h-3.5 w-3.5 mr-2" /> Export Global Report
              </Button>
          </div>
      </Card>

      {/* Node Drill-down Modal */}
      <Dialog open={isNodeModalOpen} onOpenChange={setIsNodeModalOpen}>
          <DialogContent className="max-w-[98vw] w-[1600px] max-h-[95vh] overflow-y-auto rounded-[2rem] border-outline-variant shadow-2xl p-0 bg-background sm:max-w-[98vw]">
              {selectedNode && (
                  <div className="flex flex-col h-full">
                      <div className="p-6 border-b border-outline-variant bg-surface-bright relative overflow-hidden">
                          <div className="absolute inset-0 blueprint-grid opacity-[0.03] pointer-events-none"></div>
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                              <div className="flex items-center gap-4">
                                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg border-2 border-card shrink-0">
                                      <UserIcon className="h-8 w-8 text-primary-foreground" />
                                  </div>
                                  <div>
                                      <p className="text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-0.5">NODE DRILL-DOWN // ACTIVE</p>
                                      <h2 className="font-headline text-3xl font-black text-on-surface uppercase tracking-tighter leading-none">{selectedNode.user.name}</h2>
                                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">{selectedNode.user.email} // CYCLE {selectedNode.cycleYear}</p>
                                  </div>
                              </div>
                              <Button 
                                onClick={() => downloadNodeReport(selectedNode)}
                                className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-lg hover:brightness-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
                              >
                                  <DownloadIcon className="h-4 w-4 mr-3" /> Export Technical Telemetry
                              </Button>
                          </div>
                      </div>

                      <div className="p-8 space-y-6">
                          {selectedNode.goals.map((goal: any, idx: number) => (
                              <Card key={goal.id} className="border border-outline-variant/30 rounded-3xl overflow-hidden bg-card group shadow-sm hover:border-primary/40 transition-all">
                                  <div className="p-6 flex flex-col lg:flex-row gap-8">
                                      <div className="flex-1 space-y-4">
                                          <div className="flex justify-between items-start">
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-3">
                                                      <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded border border-primary/20">SLOT {String(idx + 1).padStart(2, '0')}</span>
                                                      <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{goal.thrustArea}</span>
                                                  </div>
                                                  <h4 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">{goal.title}</h4>
                                              </div>
                                              <div className="text-right">
                                                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Operational Benchmark</p>
                                                  <p className="font-headline text-xl font-black text-on-surface">{goal.target} <span className="text-xs opacity-30">{goal.uom}</span></p>
                                              </div>
                                          </div>

                                          <p className="text-xs text-on-surface-variant font-medium leading-relaxed bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/10 italic">"{goal.description}"</p>
                                      </div>

                                      <div className="w-full lg:w-[500px] shrink-0 space-y-4">
                                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 ml-1">Quarterly Execution Telemetry</p>
                                          <div className="grid grid-cols-2 gap-4">
                                              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                                                  const checkIn = goal.checkIns?.find((c: any) => c.quarter === q);
                                                  return (
                                                      <div key={q} className={cn(
                                                          "p-4 rounded-2xl border flex flex-col gap-3 transition-all",
                                                          checkIn ? "bg-surface-container border-outline-variant/30 shadow-sm" : "bg-surface-container-low border-dashed border-outline-variant/10 opacity-30"
                                                      )}>
                                                          <div className="flex justify-between items-center">
                                                              <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{q} Audit</span>
                                                              {checkIn?.status === 'COMPLETED' && <CheckCircleIcon className="h-3 w-3 text-emerald-500" />}
                                                          </div>
                                                          <div className="flex items-end gap-2">
                                                              <span className="text-2xl font-headline font-black text-primary leading-none">
                                                                  {checkIn?.actualAchievement ?? 0}%
                                                              </span>
                                                              <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase mb-0.5">Index</span>
                                                          </div>
                                                          {checkIn?.employeeComment && (
                                                              <div className="mt-1 pt-2 border-t border-outline-variant/10">
                                                                  <p className="text-[10px] font-medium text-on-surface-variant italic line-clamp-2 leading-snug">"{checkIn.employeeComment}"</p>
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  </div>
                              </Card>
                          ))}
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>

      {/* Escalation Terminal */}
      <Card className="p-6 rounded-2xl shadow-lg border-outline-variant/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
              <div className="flex items-center gap-3">
                  <AlertTriangleIcon className="h-4 w-4 text-error" />
                  <div>
                      <h3 className="font-headline text-lg font-black text-on-surface uppercase tracking-tighter leading-none">Escalation Terminal</h3>
                      <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-0.5 opacity-40">Strategic Bottleneck Records</p>
                  </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest mr-2">Page {escalationPage} of {pagedEscalation.total || 1}</span>
                  <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg border-outline-variant/40 bg-card hover:bg-surface-container-low disabled:opacity-20"
                        onClick={() => setEscalationPage(escalationPage - 1)}
                        disabled={escalationPage === 1}
                      >
                          <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg border-outline-variant/40 bg-card hover:bg-surface-container-low disabled:opacity-20"
                        onClick={() => setEscalationPage(escalationPage + 1)}
                        disabled={escalationPage === pagedEscalation.total || pagedEscalation.total === 0}
                      >
                          <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/20">
            <Table>
                <TableHeader>
                <TableRow className="bg-surface-container-low border-b border-outline-variant/10 h-10">
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">Affected User</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">Trigger Rule</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6 text-center">Level</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6 text-center">Status</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] text-right px-6">Triggered At</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-outline-variant/5">
                {pagedEscalation.current.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-surface-bright transition-colors h-12 group">
                    <TableCell className="font-bold text-xs px-6 text-on-surface group-hover:text-primary transition-colors">{log.user.name}</TableCell>
                    <TableCell className="px-6 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{log.rule.name}</TableCell>
                    <TableCell className="text-center px-6">
                        <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest",
                            log.currentLevel === 'EMPLOYEE' ? "bg-primary/10 text-primary border border-primary/20" :
                            log.currentLevel === 'MANAGER' ? "bg-secondary/10 text-on-surface border border-outline-variant/50" :
                            "bg-error/10 text-error border border-error/20"
                        )}>
                            {log.currentLevel}
                        </span>
                    </TableCell>
                    <TableCell className="text-center px-6">
                        <div className="inline-flex items-center gap-1.5">
                            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", log.status === 'ACTIVE' ? "bg-error" : "bg-emerald-500")}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{log.status}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right text-[8px] text-on-surface-variant/40 font-bold px-6">
                        {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    </TableRow>
                ))}
                {pagedEscalation.current.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs font-bold text-on-surface-variant/20 uppercase tracking-widest">No active bottlenecks detected</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
      </Card>

      {/* Audit Trail */}
      <Card className="p-6 rounded-2xl shadow-lg border-outline-variant/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-outline-variant/10 pb-4">
              <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-4 w-4 text-on-surface-variant opacity-60" />
                  <div>
                      <h3 className="font-headline text-lg font-black text-on-surface uppercase tracking-tighter leading-none">Audit Trail</h3>
                      <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-[0.3em] mt-0.5 opacity-40">System Operation Records</p>
                  </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest mr-2">Page {auditPage} of {pagedAudit.total || 1}</span>
                  <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg border-outline-variant/40 bg-card hover:bg-surface-container-low disabled:opacity-20"
                        onClick={() => setAuditPage(auditPage - 1)}
                        disabled={auditPage === 1}
                      >
                          <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg border-outline-variant/40 bg-card hover:bg-surface-container-low disabled:opacity-20"
                        onClick={() => setAuditPage(auditPage + 1)}
                        disabled={auditPage === pagedAudit.total || pagedAudit.total === 0}
                      >
                          <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                  </div>
              </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/20">
            <Table>
                <TableHeader>
                <TableRow className="bg-surface-container-low border-b border-outline-variant/10 h-10">
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">User</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">Action</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">Entity</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] px-6">Details</TableHead>
                    <TableHead className="font-black text-on-surface-variant text-[8px] uppercase tracking-[0.1em] text-right px-6">Timestamp</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-outline-variant/5">
                {pagedAudit.current.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-surface-bright transition-colors h-12 group">
                    <TableCell className="font-bold text-xs px-6 text-on-surface group-hover:text-primary transition-colors">{log.user.name}</TableCell>
                    <TableCell className="px-6">
                        <span className="glass-status border-outline-variant text-[7px] px-2 py-0.5 rounded-full font-black uppercase">{log.action}</span>
                    </TableCell>
                    <TableCell className="text-[9px] text-on-surface-variant/60 font-bold uppercase px-6">{log.entityType}</TableCell>
                    <TableCell className="text-[11px] font-medium px-6 text-on-surface-variant">{log.details}</TableCell>
                    <TableCell className="text-right text-[8px] text-on-surface-variant/40 font-bold px-6">
                        {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    </TableRow>
                ))}
                {pagedAudit.current.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-xs font-bold text-on-surface-variant/20 uppercase tracking-widest">No operation records found</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
      </Card>
    </div>
  );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}