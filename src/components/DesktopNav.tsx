import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { 
  Home, MapPin, Trophy, User, LayoutDashboard, 
  Store, LogIn, LogOut, Shield, Plus
} from 'lucide-react';

export function DesktopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isOwner, isShopOwner } = useUserRole();

  const isActive = (path: string) => location.pathname === path;

  const NavButton = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => (
    <Button
      variant={isActive(path) ? 'default' : 'ghost'}
      size="sm"
      onClick={() => navigate(path)}
      className={`gap-2 ${isActive(path) ? 'shadow-md' : ''}`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  );

  return (
    <div className="hidden md:flex items-center gap-2">
      <NavButton path="/" icon={Home} label="Home" />
      <NavButton path="/map" icon={MapPin} label="Map" />
      <NavButton path="/leaderboard" icon={Trophy} label="Leaderboard" />

      {user && (
        <>
          {/* Customer items */}
          {!isOwner && !isShopOwner && (
            <NavButton path="/profile" icon={User} label="Profile" />
          )}

          {/* Shop Owner items */}
          {isShopOwner && (
            <>
              <NavButton path="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavButton path="/shop-profile" icon={Store} label="Shop" />
              <Button size="sm" onClick={() => navigate('/add-shop')} className="gap-2 bg-primary">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Add Shop</span>
              </Button>
            </>
          )}

          {/* Owner items */}
          {isOwner && (
            <Button
              size="sm"
              onClick={() => navigate('/owner-dashboard')}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden lg:inline">Admin</span>
            </Button>
          )}
        </>
      )}

      <div className="h-6 w-px bg-border mx-2" />

      {user && <NotificationBell />}

      {user ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="gap-2 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:inline">Logout</span>
        </Button>
      ) : (
        <Button size="sm" onClick={() => navigate('/auth')} className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      )}
    </div>
  );
}
