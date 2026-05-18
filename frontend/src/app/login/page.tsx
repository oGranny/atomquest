'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RocketIcon, ShieldCheckIcon, InfoIcon, UserPlusIcon, LockIcon } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter your credentials');
    
    setLoading(true);
    try {
      await login(email, password);
      toast.success('System Authenticated.');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed. Check your ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface relative overflow-hidden font-sans antialiased">
      {/* Precision Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#141b2b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      {/* Decorative Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-container rounded-full opacity-10 blur-[120px]"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary rounded-full opacity-5 blur-[100px]"></div>

      <div className="w-full max-w-[420px] z-10 p-6">
        
        {/* Branding Cluster */}
        <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-primary-container rounded-2xl flex items-center justify-center shadow-level-1 mb-6 transform rotate-3">
                <RocketIcon className="h-10 w-10 text-on-primary-container -rotate-3" />
            </div>
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                AtomQuest <span className="text-primary">1.0</span>
              </h1>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1px] w-8 bg-outline-variant"></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">Industrial Portal</p>
                <div className="h-[1px] w-8 bg-outline-variant"></div>
              </div>
            </div>
        </div>

        <Card className="border-outline-variant shadow-level-2 bg-card overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="space-y-1 pb-6 pt-8 text-center">
                <CardTitle className="font-headline text-2xl font-bold text-on-surface">Login</CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/70">
                   Access required
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                    <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                          Corporate ID (Email)
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="operator@atomberg.com"
                            required
                            className="bg-surface-container-low border-none h-12 px-6 focus:bg-card focus:ring-2 focus:ring-primary-container transition-all text-on-surface font-sans font-medium text-base shadow-inner"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center ml-1">
                            <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              Password
                            </Label>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-surface-container-low border-none h-12 px-6 focus:bg-card focus:ring-2 focus:ring-primary-container transition-all text-on-surface font-sans font-medium text-base shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <LockIcon className="absolute right-5 top-3.5 h-4 w-4 text-on-surface-variant/30" />
                        </div>
                    </div>
                </CardContent>
                <div className='h-5'></div>
                <CardFooter className="flex flex-col gap-6 pt-4 pb-8">
                    <Button 
                        className="w-full h-14 bg-secondary text-white font-bold text-base hover:bg-on-surface shadow-md active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-3 group" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? (
                          <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        ) : (
                          <>
                            <ShieldCheckIcon className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                            <span>Submit</span>
                          </>
                        )}
                    </Button>

                    {/* <div className="bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/30 w-full">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <InfoIcon className="h-3 w-3" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter">System Access Info</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                            Use your corporate credentials to authenticate. New nodes must <Link href="/signup" className="text-primary font-bold hover:underline">Provision Account</Link> first.
                        </p>
                    </div> */}

                    <div className="pt-2 text-center w-full">
                        <Link href="/signup" className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 hover:text-primary transition-all group/link">
                             <UserPlusIcon className="h-3 w-3 group-hover/link:scale-110" /> Sign Up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
        
        <p className="text-center text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-30 mt-12">
            
        </p>
      </div>
    </div>
  );
}