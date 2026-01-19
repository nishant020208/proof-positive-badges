import { CheckCircle, XCircle, AlertCircle, Loader2, Brain, Shield, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ShopVerificationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  issues?: string[];
  suggestions?: string[];
}

interface ProofVerificationResult {
  isValid: boolean;
  isRelevant: boolean;
  confidence: number;
  supports: 'yes' | 'no' | 'inconclusive';
  reason: string;
  details: string;
}

interface AIVerificationPanelProps {
  isVerifying: boolean;
  result: ShopVerificationResult | ProofVerificationResult | null;
  type: 'shop' | 'proof';
}

export function AIVerificationPanel({ isVerifying, result, type }: AIVerificationPanelProps) {
  if (isVerifying) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-primary animate-pulse" />
            <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">AI Analyzing Image...</p>
            <p className="text-xs text-muted-foreground">Please wait while we verify your {type === 'shop' ? 'shop image' : 'proof'}</p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isProof = type === 'proof';
  const proofResult = result as ProofVerificationResult;
  const shopResult = result as ShopVerificationResult;

  const isValid = result.isValid;
  const confidence = result.confidence || 0;
  
  // Determine status color and icon
  let statusColor = 'text-green-500';
  let StatusIcon = CheckCircle;
  let bgColor = 'bg-green-500/10 border-green-500/20';
  let statusText = 'Verified';

  if (!isValid) {
    statusColor = 'text-red-500';
    StatusIcon = XCircle;
    bgColor = 'bg-red-500/10 border-red-500/20';
    statusText = 'Invalid';
  } else if (confidence < 70) {
    statusColor = 'text-yellow-500';
    StatusIcon = AlertCircle;
    bgColor = 'bg-yellow-500/10 border-yellow-500/20';
    statusText = 'Review Needed';
  }

  return (
    <div className={`p-4 rounded-xl border ${bgColor} space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          <Shield className={`h-5 w-5 ${statusColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
            <span className={`font-semibold text-sm ${statusColor}`}>{statusText}</span>
            <span className="text-xs text-muted-foreground">
              ({confidence}% confidence)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">AI Verification Complete</p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Confidence Score</span>
          <span className={confidence >= 70 ? 'text-green-500' : confidence >= 50 ? 'text-yellow-500' : 'text-red-500'}>
            {confidence}%
          </span>
        </div>
        <Progress 
          value={confidence} 
          className="h-2"
        />
      </div>

      {/* Analysis Result */}
      <div className="p-3 rounded-lg bg-background/50">
        <p className="text-sm">{result.reason}</p>
        
        {isProof && proofResult.details && (
          <p className="text-xs text-muted-foreground mt-2">{proofResult.details}</p>
        )}

        {isProof && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Support for claim:</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              proofResult.supports === 'yes' ? 'bg-green-500/20 text-green-600' :
              proofResult.supports === 'no' ? 'bg-red-500/20 text-red-600' :
              'bg-yellow-500/20 text-yellow-600'
            }`}>
              {proofResult.supports === 'yes' ? '✓ Supports' :
               proofResult.supports === 'no' ? '✗ Contradicts' :
               '? Inconclusive'}
            </span>
          </div>
        )}
      </div>

      {/* Issues & Suggestions for Shop Verification */}
      {!isProof && shopResult.issues && shopResult.issues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-red-500">Issues Found:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {shopResult.issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-red-400">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isProof && shopResult.suggestions && shopResult.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-primary">Suggestions:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {shopResult.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-primary">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
