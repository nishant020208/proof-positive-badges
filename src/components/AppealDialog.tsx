import { useState } from 'react';
import { AlertTriangle, Upload, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voteId: string;
  shopId: string;
  badgeName?: string;
  onSuccess?: () => void;
}

export function AppealDialog({
  open,
  onOpenChange,
  voteId,
  shopId,
  badgeName,
  onSuccess,
}: AppealDialogProps) {
  const [reason, setReason] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your appeal');
      return;
    }

    setIsSubmitting(true);
    try {
      let evidenceUrl = null;

      // Upload evidence if provided
      if (evidenceFile) {
        const fileExt = evidenceFile.name.split('.').pop();
        const fileName = `${shopId}/${voteId}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('proof-images')
          .upload(fileName, evidenceFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('proof-images')
          .getPublicUrl(fileName);

        evidenceUrl = urlData.publicUrl;
      }

      // Create appeal
      const { error } = await supabase.from('appeals').insert({
        shop_id: shopId,
        vote_id: voteId,
        appeal_reason: reason.trim(),
        evidence_url: evidenceUrl,
      });

      if (error) throw error;

      toast.success('Appeal submitted successfully! An admin will review it.');
      setReason('');
      setEvidenceFile(null);
      setEvidencePreview(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Appeal error:', error);
      toast.error(error.message || 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Appeal Vote
          </DialogTitle>
          <DialogDescription>
            {badgeName
              ? `Submit an appeal for the vote on "${badgeName}". Provide evidence to support your case.`
              : 'Submit an appeal with evidence to dispute this vote.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Appeal *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you believe this vote is unfair or inaccurate..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            {evidencePreview ? (
              <div className="relative">
                <img
                  src={evidencePreview}
                  alt="Evidence preview"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setEvidenceFile(null);
                    setEvidencePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload evidence
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Submit Appeal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
