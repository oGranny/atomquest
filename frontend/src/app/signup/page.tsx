'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RocketIcon, UserPlusIcon, InfoIcon, ArrowLeftIcon, LockIcon } from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    managerId: ''
  });
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
      const loadManagers = async () => {
          try {
              const data = await fetchApi('/auth/managers');
              setManagers(data);
          } catch (e: any) {
              console.error('Failed to load managers', e);
          }
      };
      loadManagers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
        return toast.error('Please fill all required fields');
    }
    
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.managerId || undefined);
      toast.success('Account provisioned. Welcome to AtomQuest.');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans antialiased">
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-[0.03]"></div>
      
      <div className="w-full max-w-[420px] z-10 p-6">
        
        <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center shadow-level-1 mb-6 transform rotate-3">
                <RocketIcon className="h-10 w-10 text-on-primary-container -rotate-3" />
            </div>
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                Join AtomQuest
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant/40 mt-2">Provision New Strategic Node</p>
            </div>
        </div>

        <Card className="border-outline-variant shadow-level-2 bg-card overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="space-y-1 pb-8 pt-8 text-center">
                <CardTitle className="font-headline text-2xl font-bold text-on-surface">User Registration</CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
                    Initialize your performance profile
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Full Legal Name</Label>
                        <Input
                            placeholder="John Doe"
                            required
                            className="bg-surface-container-low border-none h-12 px-5 text-on-surface font-medium shadow-inner"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Corporate Email</Label>
                        <Input
                            type="email"
                            placeholder="doe.j@atomberg.com"
                            required
                            className="bg-surface-container-low border-none h-12 px-5 text-on-surface font-medium shadow-inner"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Security Key (Password)</Label>
                        <div className="relative">
                            <Input
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-surface-container-low border-none h-12 px-5 text-on-surface font-medium shadow-inner"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <LockIcon className="absolute right-4 top-3.5 h-4 w-4 text-on-surface-variant/30" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Reporting Manager</Label>
                        <Select value={formData.managerId} onValueChange={(val) => val && setFormData({ ...formData, managerId: val })}>
                            <SelectTrigger className="bg-surface-container-low border-none h-12 px-5 text-on-surface font-medium shadow-inner text-left">
                                <SelectValue placeholder="Select your supervisor..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                                {managers.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-3 uppercase">{m.name}</SelectItem>
                                ))}
                                {managers.length === 0 && (
                                    <SelectItem value="null" disabled className="text-[10px] opacity-30 italic">No managers found in roster</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-4 pb-8">
                    <Button 
                        className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs hover:brightness-105 shadow-lg active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-3" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? 'Provisioning...' : 'Provision Account'}
                    </Button>

                    <Link href="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors">
                        <ArrowLeftIcon className="h-3 w-3" /> Return to Login
                    </Link>
                </CardFooter>
            </form>
        </Card>
        
        <div className="bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/30 w-full mt-6 text-center">
            <p className="text-[10px] text-on-surface-variant leading-relaxed font-bold uppercase tracking-widest opacity-40">
                New accounts are assigned the <span className="text-primary">EMPLOYEE</span> role by default.
            </p>
        </div>
      </div>
    </div>
  );
}