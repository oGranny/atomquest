'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  SettingsIcon, 
  MonitorIcon, 
  CodeIcon,
  LogOutIcon,
  ToggleLeftIcon,
  SearchIcon,
  RefreshCwIcon,
  ZapIcon,
  ActivityIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user, logout, devMode, setDevMode } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isAdmin = user?.role === 'ADMIN';

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
      if (isAdmin) {
          loadUsers();
      }
  }, [isAdmin]);

  const loadUsers = async () => {
      setLoadingUsers(true);
      try {
          const data = await fetchApi('/auth/all-users');
          setAllUsers(data);
      } catch (error: any) {
          toast.error('Failed to load user roster');
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
      try {
          await fetchApi('/auth/update-role', {
              method: 'PUT',
              body: JSON.stringify({ userId, role: newRole })
          });
          toast.success(`User role updated to ${newRole}`);
          loadUsers();
      } catch (error: any) {
          toast.error(error.message);
      }
  };

  const triggerManualJobs = async () => {
      setIsTriggering(true);
      try {
          const res = await fetchApi('/reports/trigger-jobs', { method: 'POST' });
          toast.success(`Jobs Executed: ${res.reminderResults.count} Reminders, ${res.escalationResults.count} Escalations.`);
      } catch (error: any) {
          toast.error('Job execution failed.');
      } finally {
          setIsTriggering(false);
      }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Session terminated securely.');
  };

  const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header title="System Configuration" />
      
      <div className="flex-1 overflow-y-auto p-12 relative flex items-center justify-center">
        <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
        
        <div className={cn(
            "w-full space-y-10 relative z-10 transition-all duration-500",
            isAdmin ? "max-w-5xl" : "max-w-2xl"
        )}>
          <div className={cn("flex flex-col md:flex-row justify-between items-center gap-6", !isAdmin && "text-center md:text-left")}>
              <div className={cn(!isAdmin && "flex flex-col items-center md:items-start")}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container/10 border border-primary-container/20 rounded-full text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">
                    <SettingsIcon className="h-4 w-4" /> Core Preferences
                </div>
                <h1 className="font-headline text-5xl font-black text-on-surface uppercase tracking-tighter leading-none">Settings</h1>
              </div>
              <Button 
                variant="destructive" 
                className="bg-error text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-md hover:bg-error/90 transition-all flex items-center gap-2"
                onClick={handleLogout}
              >
                  <LogOutIcon className="h-4 w-4" /> Terminate Session
              </Button>
          </div>

          <div className={cn(
              "grid gap-8 transition-all duration-500",
              isAdmin ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}>
              <Card className="rounded-[3rem] shadow-2xl border border-outline-variant/40 bg-card overflow-hidden">
                <CardContent className="p-10 space-y-10">
                    <h3 className="font-headline text-xl font-black uppercase tracking-widest text-on-surface-variant/40">Interface Configuration</h3>
                    
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/50 group-hover/item:border-primary transition-colors">
                                <MonitorIcon className="h-5 w-5 text-on-surface-variant group-hover/item:text-primary transition-colors" />
                            </div>
                            <div>
                                <Label className="font-headline text-lg font-black text-on-surface">Dark Mode</Label>
                                <p className="font-sans text-[10px] text-on-surface-variant opacity-60 mt-0.5">High-contrast industrial theme.</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className={cn(
                                "h-12 w-20 rounded-full transition-all",
                                theme === 'dark' ? "border-primary/20 bg-primary/5 text-primary" : "border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                            )}
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <ToggleLeftIcon className={cn("h-8 w-8 transition-transform duration-300", theme === 'dark' ? "rotate-0" : "rotate-180 opacity-40")} />
                        </Button>
                    </div>

                    <div className="h-px w-full bg-outline-variant/20"></div>

                    {/* Dev Mode Toggle */}
                    <div className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/50 group-hover/item:border-primary transition-colors">
                                <CodeIcon className="h-5 w-5 text-on-surface-variant group-hover/item:text-primary transition-colors" />
                            </div>
                            <div>
                                <Label className="font-headline text-lg font-black text-on-surface">Developer Mode</Label>
                                <p className="font-sans text-[10px] text-on-surface-variant opacity-60 mt-0.5">Unlock advanced diagnostic telemetry.</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className={cn(
                                "h-12 w-20 rounded-full transition-all",
                                devMode ? "border-primary/20 bg-primary/5 text-primary" : "border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                            )}
                            onClick={() => setDevMode(!devMode)}
                        >
                            <ToggleLeftIcon className={cn("h-8 w-8 transition-transform duration-300", devMode ? "rotate-0" : "rotate-180 opacity-40")} />
                        </Button>
                    </div>

                    {isAdmin && (
                        <>
                            <div className="h-px w-full bg-outline-variant/20"></div>
                            {/* Manual Job Trigger (Admin Only) */}
                            <div className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover/item:bg-primary transition-colors">
                                        <ZapIcon className="h-5 w-5 text-primary group-hover/item:text-primary-foreground transition-colors" />
                                    </div>
                                    <div>
                                        <Label className="font-headline text-lg font-black text-on-surface">Execute System Jobs</Label>
                                        <p className="font-sans text-[10px] text-on-surface-variant opacity-60 mt-0.5">Trigger reminders & escalations manually.</p>
                                    </div>
                                </div>
                                <Button 
                                    disabled={isTriggering}
                                    className="bg-card text-on-surface border border-outline-variant/40 hover:bg-primary hover:text-primary-foreground font-black uppercase text-[9px] tracking-widest h-12 px-6 rounded-xl shadow-sm transition-all"
                                    onClick={triggerManualJobs}
                                >
                                    {isTriggering ? <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" /> : <ZapIcon className="h-4 w-4 mr-2" />}
                                    Trigger Now
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
              </Card>

              {isAdmin && (
                  <Card className="rounded-[3rem] shadow-2xl border border-outline-variant/40 bg-card overflow-hidden h-full">
                    <CardContent className="p-10 flex flex-col h-full space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-headline text-xl font-black uppercase tracking-widest text-primary">Role Management</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface-variant/40" onClick={loadUsers}>
                                <RefreshCwIcon className={cn("h-4 w-4", loadingUsers && "animate-spin")} />
                            </Button>
                        </div>

                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-3 h-4 w-4 text-on-surface-variant opacity-30" />
                            <Input 
                                placeholder="Search IDs by name or email..." 
                                className="bg-surface-container-low border-none pl-12 h-10 rounded-xl text-xs font-bold shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-2 custom-scrollbar">
                            {filteredUsers.map((u) => (
                                <div key={u.id} className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/20 flex items-center justify-between gap-4 group/user hover:bg-surface-container-low transition-all">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-headline text-sm font-black text-on-surface truncate leading-tight">{u.name}</p>
                                        <p className="text-[9px] font-bold text-on-surface-variant opacity-40 truncate uppercase tracking-widest mt-1">{u.email}</p>
                                    </div>
                                    <Select value={u.role} onValueChange={(val) => handleRoleUpdate(u.id, val)}>
                                        <SelectTrigger className="w-28 h-8 bg-card border-outline-variant/40 rounded-lg text-[9px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                                            <SelectItem value="EMPLOYEE" className="text-[9px] font-black py-2 uppercase">Employee</SelectItem>
                                            <SelectItem value="MANAGER" className="text-[9px] font-black py-2 uppercase">Manager</SelectItem>
                                            <SelectItem value="ADMIN" className="text-[9px] font-black py-2 uppercase text-primary">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && !loadingUsers && (
                                <div className="text-center py-10 opacity-20 uppercase font-black text-[10px] tracking-widest">No matching IDs found</div>
                            )}
                        </div>
                    </CardContent>
                  </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}