import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Leaf, Store, User, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type UserType = 'customer' | 'shop_owner' | 'owner';

export default function Auth() {
  const { user, signIn, signUp, loading } = useFirebaseAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [userType, setUserType] = useState<UserType>('customer');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Check whitelist when selecting Owner type and email changes
  useEffect(() => {
    if (userType === 'owner' && email && authMode === 'signup') {
      const timer = setTimeout(() => checkOwnerWhitelist(email), 500);
      return () => clearTimeout(timer);
    } else {
      setIsWhitelisted(null);
    }
  }, [userType, email, authMode]);

  const checkOwnerWhitelist = async (emailToCheck: string) => {
    setCheckingWhitelist(true);
    try {
      const docRef = doc(db, 'ownerWhitelist', emailToCheck.toLowerCase());
      const docSnap = await getDoc(docRef);
      setIsWhitelisted(docSnap.exists() && docSnap.data()?.status === 'pending');
    } catch (error) {
      setIsWhitelisted(false);
    }
    setCheckingWhitelist(false);
  };

  const validateForm = () => {
    try {
      if (authMode === 'signup') {
        authSchema.parse({ email, password, fullName });
        
        if (userType === 'owner' && !isWhitelisted) {
          setErrors({ email: 'This email is not whitelisted for Owner access' });
          return false;
        }
      } else {
        authSchema.omit({ fullName: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('auth/invalid-credential') || error.message.includes('auth/wrong-password')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('auth/user-not-found')) {
            toast.error('No account found with this email');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName, userType);
        
        if (error) {
          if (error.message.includes('auth/email-already-in-use')) {
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 ml-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-lg" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display text-xl font-bold">GreenScore</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 w-fit">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">
              {authMode === 'login' ? 'Welcome Back' : 'Join GreenScore'}
            </CardTitle>
            <CardDescription>
              {authMode === 'login' 
                ? 'Sign in to rate shops and track your impact' 
                : 'Create an account to start your eco journey'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-medium">Login</TabsTrigger>
                <TabsTrigger value="signup" className="font-medium">Sign Up</TabsTrigger>
              </TabsList>

              {authMode === 'signup' && (
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3 block">I am a:</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserType('customer')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        userType === 'customer'
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <User className={`h-6 w-6 mx-auto mb-1 ${
                        userType === 'customer' ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <p className={`text-xs font-medium ${
                        userType === 'customer' ? 'text-primary' : 'text-foreground'
                      }`}>Customer</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setUserType('shop_owner')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        userType === 'shop_owner'
                          ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/10'
                          : 'border-border hover:border-secondary/50'
                      }`}
                    >
                      <Store className={`h-6 w-6 mx-auto mb-1 ${
                        userType === 'shop_owner' ? 'text-secondary-foreground' : 'text-muted-foreground'
                      }`} />
                      <p className={`text-xs font-medium ${
                        userType === 'shop_owner' ? 'text-secondary-foreground' : 'text-foreground'
                      }`}>Shop Owner</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType('owner')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        userType === 'owner'
                          ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <Shield className={`h-6 w-6 mx-auto mb-1 ${
                        userType === 'owner' ? 'text-accent-foreground' : 'text-muted-foreground'
                      }`} />
                      <p className={`text-xs font-medium ${
                        userType === 'owner' ? 'text-accent-foreground' : 'text-foreground'
                      }`}>Owner</p>
                    </button>
                  </div>

                  {userType === 'owner' && (
                    <div className="mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-xs text-accent-foreground">
                        <Shield className="h-3 w-3 inline mr-1" />
                        Owner accounts require email whitelisting by an existing Owner.
                      </p>
                      {email && !checkingWhitelist && isWhitelisted !== null && (
                        <p className={`text-xs mt-1 ${isWhitelisted ? 'text-primary' : 'text-destructive'}`}>
                          {isWhitelisted ? '✓ Your email is whitelisted!' : '✗ Email not whitelisted'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className={`bg-background/50 ${errors.fullName ? 'border-destructive' : ''}`}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`bg-background/50 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium shadow-lg shadow-primary/25" 
                  disabled={isLoading || (authMode === 'signup' && userType === 'owner' && !isWhitelisted)}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                  ) : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
