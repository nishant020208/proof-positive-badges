import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { MobileNav } from './MobileNav';
import { DesktopNav } from './DesktopNav';

export function AppHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-xl" style={{ borderColor: 'hsla(142, 71%, 45%, 0.1)' }}>
      <div className="container flex items-center justify-between h-16">
        {/* Left side - Mobile nav + Logo */}
        <div className="flex items-center gap-3">
          <MobileNav />
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
              <div className="relative p-2.5 rounded-2xl eco-gradient shadow-lg shadow-primary/25">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-vardant text-lg font-bold tracking-wider gradient-text">
                VARDANT
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wide">Eco Verification</p>
            </div>
          </button>
        </div>

        {/* Right side - Desktop nav */}
        <DesktopNav />
      </div>
    </header>
  );
}
