'use client';

import { useEffect, useState } from 'react';
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
import { UsersIcon, SendIcon, CheckCircle2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PushSharedGoalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subordinates, setSubordinates] = useState<any[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    thrustArea: '',
    title: '',
    description: '',
    uom: 'NUMERIC',
    target: '',
    weightage: '10',
    cycleYear: '2026'
  });

  useEffect(() => {
    if (user) {
        loadSubordinates();
    }
  }, [user]);

  const loadSubordinates = async () => {
    try {
      const data = await fetchApi('/goals/subordinates');
      setSubordinates(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleEmp = (id: string) => {
    setSelectedEmps(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePush = async () => {
    if (selectedEmps.length === 0) return toast.error('Select at least one employee');
    setLoading(true);
    try {
      await fetchApi('/goals/push-shared', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          employeeIds: selectedEmps,
          target: parseFloat(formData.target),
          weightage: parseFloat(formData.weightage),
          cycleYear: parseInt(formData.cycleYear)
        }),
      });
      toast.success('Shared goal distributed to selected team members.');
      router.push('/dashboard/review');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Strategic KPI Distribution" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-margin-desktop">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="md:col-span-2 space-y-6">
                <Card className="border-outline-variant shadow-level-1">
                    <CardHeader className="border-b border-surface-container">
                        <CardTitle className="font-headline text-lg font-bold">Goal Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Goal Title</Label>
                                <Input 
                                    className="bg-surface-container-low border-none" 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Thrust Area</Label>
                                <Input 
                                    className="bg-surface-container-low border-none" 
                                    value={formData.thrustArea}
                                    onChange={e => setFormData({...formData, thrustArea: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Shared Description</Label>
                            <Textarea 
                                className="bg-surface-container-low border-none min-h-[100px]" 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">UoM</Label>
                                <Select value={formData.uom} onValueChange={val => val && setFormData({...formData, uom: val})}>
                                    <SelectTrigger className="bg-surface-container-low border-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NUMERIC">Numeric</SelectItem>
                                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                        <SelectItem value="TIMELINE">Timeline</SelectItem>
                                        <SelectItem value="ZERO_BASED">Zero-based</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Target</Label>
                                <Input 
                                    type="number" 
                                    className="bg-surface-container-low border-none" 
                                    value={formData.target}
                                    onChange={e => setFormData({...formData, target: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Weightage (%)</Label>
                                <Input 
                                    type="number" 
                                    className="bg-surface-container-low border-none" 
                                    value={formData.weightage}
                                    onChange={e => setFormData({...formData, weightage: e.target.value})}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="border-outline-variant shadow-level-1 h-fit">
                    <CardHeader className="border-b border-surface-container">
                        <CardTitle className="font-headline text-lg font-bold flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-primary" /> Recipients
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {subordinates.map(emp => (
                                <div 
                                    key={emp.id}
                                    onClick={() => toggleEmp(emp.id)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                                        selectedEmps.includes(emp.id) ? "bg-primary-container/20 text-on-primary-container" : "hover:bg-surface-container-low"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-[10px]">
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">{emp.name}</p>
                                            <p className="text-[9px] opacity-60">{emp.email}</p>
                                        </div>
                                    </div>
                                    {selectedEmps.includes(emp.id) && <CheckCircle2Icon className="h-4 w-4 text-primary" />}
                                </div>
                            ))}
                            {subordinates.length === 0 && <p className="p-8 text-center text-xs text-on-surface-variant opacity-50">No subordinates found.</p>}
                        </div>
                        <div className="pt-6 border-t border-surface-container mt-4 px-2">
                            <Button 
                                className="w-full bg-secondary text-white font-bold h-12" 
                                disabled={loading || selectedEmps.length === 0}
                                onClick={handlePush}
                            >
                                <SendIcon className="h-4 w-4 mr-2" /> {loading ? 'Distributing...' : `Push to ${selectedEmps.length} Members`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}