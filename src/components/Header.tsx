import { Leaf } from 'lucide-react';

interface HeaderProps {
  onBackToList?: () => void;
  showBack?: boolean;
}

export function Header({ onBackToList, showBack }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <button 
          onClick={onBackToList}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center shadow-glow-eco">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            GreenScore
          </span>
        </button>

        {showBack && onBackToList && (
          <button
            onClick={onBackToList}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to shops
          </button>
        )}
      </div>
    </header>
  );
}
