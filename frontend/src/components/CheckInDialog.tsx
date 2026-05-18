'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import { CalendarIcon, TargetIcon, AlertCircleIcon } from 'lucide-react';

interface CheckInDialogProps {
  goal: any;
  quarter: string;
  onCheckInCompleted: () => void;
}

export default function CheckInDialog({ goal, quarter, onCheckInCompleted }: CheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    actualAchievement: '',
    status: 'NOT_STARTED',
    achievementDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi('/checkins/log', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          goalId: goal.id,
          quarter,
          actualAchievement: goal.uom === 'TIMELINE' ? 1 : parseFloat(formData.actualAchievement || '0'),
        }),
      });
      toast.success('System state updated successfully');
      setOpen(false);
      onCheckInCompleted();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-outline-variant bg-card shadow-sm hover:bg-surface-container-low h-10 px-6">
        Log Progress
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-outline-variant shadow-level-3">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                <TargetIcon className="h-5 w-5 text-on-primary-container" />
             </div>
             <div>
                <DialogTitle className="font-headline text-lg font-black uppercase tracking-tight">Quarterly Update: {quarter}</DialogTitle>
                <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Precision Performance Node</p>
             </div>
          </div>
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
             <p className="text-xs font-bold text-on-surface line-clamp-2 uppercase tracking-tight leading-tight">{goal.title}</p>
             <p className="text-[9px] font-medium text-on-surface-variant mt-2">Target: {goal.target} {goal.uom}</p>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {goal.uom === 'TIMELINE' ? (
            <div className="space-y-3">
              <Label htmlFor="achievementDate" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Completion Date</Label>
              <div className="relative">
                <Input 
                    id="achievementDate" 
                    type="date" 
                    required 
                    className="bg-card border-outline-variant rounded-xl h-12 px-5 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-on-surface"
                    value={formData.achievementDate} 
                    onChange={(e) => setFormData({ ...formData, achievementDate: e.target.value })} 
                />
                <CalendarIcon className="absolute right-4 top-3 h-5 w-5 text-on-surface-variant opacity-20 pointer-events-none" />
              </div>
            </div>
          ) : goal.uom === 'ZERO_BASED' ? (
            <div className="space-y-3">
              <Label htmlFor="actualAchievement" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Binary Outcome</Label>
              <Select value={formData.actualAchievement} onValueChange={(value) => value && setFormData({ ...formData, actualAchievement: value })}>
                <SelectTrigger className="bg-card border-outline-variant rounded-xl h-12 px-5 font-bold text-xs focus:ring-4 focus:ring-primary/10 shadow-sm">
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                  <SelectItem value="0" className="font-bold text-xs py-3 uppercase tracking-wider text-[#2E7D32]">Success (0 Incidents)</SelectItem>
                  <SelectItem value="1" className="font-bold text-xs py-3 uppercase tracking-wider text-error">Issue Detected (1+ Incidents)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-2 mt-2 ml-1">
                  <AlertCircleIcon className="h-3 w-3" /> System Metric: 0 represents 100% success
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="actualAchievement" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Actual Achievement</Label>
              <Input 
                  id="actualAchievement" 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter numerical achievement..."
                  required 
                  className="bg-card border-outline-variant rounded-xl h-12 px-5 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-on-surface"
                  value={formData.actualAchievement} 
                  onChange={(e) => setFormData({ ...formData, actualAchievement: e.target.value })} 
              />
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Operational Status</Label>
            <Select value={formData.status} onValueChange={(value) => value && setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-card border-outline-variant rounded-xl h-12 px-5 font-bold text-xs focus:ring-4 focus:ring-primary/10 shadow-sm">
                <SelectValue placeholder="Select current state..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-outline-variant shadow-xl">
                <SelectItem value="NOT_STARTED" className="font-bold text-xs py-3 uppercase tracking-wider">Not Started</SelectItem>
                <SelectItem value="ON_TRACK" className="font-bold text-xs py-3 uppercase tracking-wider">On Track</SelectItem>
                <SelectItem value="COMPLETED" className="font-bold text-xs py-3 uppercase tracking-wider text-[#2E7D32]">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-secondary text-white font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-xl hover:bg-on-surface active:scale-95 transition-all"
            >
                {loading ? 'Synchronizing State...' : 'Commit Achievement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}