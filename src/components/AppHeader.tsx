import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        {/* Left side - Mobile nav + Logo */}
        <div className="flex items-center gap-3">
          <MobileNav />
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-lg" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/25">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                GreenScore
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Eco Verification</p>
            </div>
          </button>
        </div>

        {/* Right side - Desktop nav */}
        <DesktopNav />
      </div>
    </header>
  );
}
