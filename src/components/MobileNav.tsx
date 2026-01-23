import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { NotificationBell } from '@/components/NotificationBell';
import { 
  Leaf, Menu, Home, MapPin, Trophy, User, LayoutDashboard, 
  Store, LogIn, LogOut, Shield, X, Plus, Package
} from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role, isOwner, isShopOwner } = useUserRole();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <button
      onClick={() => handleNavigate(path)}
      className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all ${
        isActive(path) 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
          : 'hover:bg-accent text-foreground'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="md:hidden flex items-center gap-2">
      {user && <NotificationBell />}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 border-r-0">
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-accent/20">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="font-display text-xl font-bold">GreenScore</SheetTitle>
                <p className="text-xs text-muted-foreground">Eco Verification Platform</p>
              </div>
            </div>
          </SheetHeader>

          {/* User Info */}
          {user && (
            <div className="p-4 mx-4 mt-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isOwner ? 'bg-purple-500/20 text-purple-500' :
                      isShopOwner ? 'bg-blue-500/20 text-blue-500' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {isOwner ? 'Owner' : isShopOwner ? 'Shop Owner' : 'Customer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem path="/" icon={Home} label="Home" />
            <NavItem path="/map" icon={MapPin} label="Map View" />
            <NavItem path="/leaderboard" icon={Trophy} label="Leaderboard" />

            {user && (
              <>
                <div className="py-2">
                  <p className="text-xs font-medium text-muted-foreground px-4 mb-2">MY ACCOUNT</p>
                </div>
                
                {/* Customer items */}
                {!isOwner && !isShopOwner && (
                  <NavItem path="/profile" icon={User} label="My Profile" />
                )}

                {/* Shop Owner items */}
                {isShopOwner && (
                  <>
                    <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem path="/shop-profile" icon={Store} label="Shop Profile" />
                    <NavItem path="/add-shop" icon={Plus} label="Add Shop" />
                  </>
                )}

                {/* Owner items */}
                {isOwner && (
                  <>
                    <div className="py-2">
                      <p className="text-xs font-medium text-purple-500 px-4 mb-2">ADMIN</p>
                    </div>
                    <NavItem path="/owner-dashboard" icon={Shield} label="Admin Dashboard" />
                  </>
                )}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { signOut(); setOpen(false); }}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={() => handleNavigate('/auth')}
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Button>
            )}
          </div>
        </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
