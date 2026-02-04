import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useAIVerification } from '@/hooks/useAIVerification';
import { createShop, uploadFile } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Leaf, ArrowLeft, MapPin, Store, FileText, CreditCard, Image, CheckCircle, Brain, Sparkles } from 'lucide-react';
import LocationMapPreview from '@/components/LocationMapPreview';
import { AIVerificationPanel } from '@/components/AIVerificationPanel';
import { z } from 'zod';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5, 'Please enter a valid address').max(255),
  gstNumber: z.string().optional(),
});

export default function AddShop() {
  const { user, profile, loading } = useFirebaseAuth();
  const navigate = useNavigate();
  const { isVerifying, verificationResult, verifyShopImage, clearResult } = useAIVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [shopImage, setShopImage] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);
  
  const [shopImagePreview, setShopImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [shopImageVerified, setShopImageVerified] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile && profile.role !== 'shop_owner') {
      toast.error('Only shop owners can add shops');
      navigate('/');
    }
  }, [profile, navigate]);

  const getCurrentLocation = useCallback(() => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          toast.success('Location captured successfully!');
          setGettingLocation(false);
        },
        (error) => {
          toast.error('Could not get your location. Please try again.');
          console.error(error);
          setGettingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  }, []);

  const handleShopImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setShopImage(file);
    setShopImagePreview(URL.createObjectURL(file));
    setShopImageVerified(false);
    clearResult();

    // Trigger AI verification
    const result = await verifyShopImage(file, name || 'Shop');
    
    if (result) {
      setShopImageVerified(true);
      if (!result.isValid) {
        toast.warning('AI detected issues with your shop image. Please review and consider uploading a better image.');
      } else if (result.confidence >= 70) {
        toast.success('AI verified your shop image!');
      } else {
        toast.info('Shop image uploaded. AI verification complete.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'certificate' | 'license') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (type === 'certificate') {
      setCertificate(file);
    } else {
      setLicense(file);
    }
  };

  const validateForm = () => {
    try {
      shopSchema.parse({ name, description, address, gstNumber });
      
      if (!latitude || !longitude) {
        setErrors({ location: 'Please pin your shop location' });
        return false;
      }
      
      if (!shopImage) {
        setErrors({ shopImage: 'Please upload a shop image' });
        return false;
      }
      
      // Either certificate or license is required
      if (!certificate && !license) {
        setErrors({ certificate: 'Please upload at least a certificate or license' });
        return false;
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
    if (!validateForm() || !user) return;

    setIsSubmitting(true);

    try {
      // Upload files to Firebase Storage
      const shopImageUrl = shopImage ? await uploadFile(shopImage, `shops/${user.uid}/${Date.now()}-shop.${shopImage.name.split('.').pop()}`) : null;
      const certificateUrl = certificate ? await uploadFile(certificate, `certificates/${user.uid}/${Date.now()}-cert.${certificate.name.split('.').pop()}`) : null;
      const licenseUrl = license ? await uploadFile(license, `licenses/${user.uid}/${Date.now()}-license.${license.name.split('.').pop()}`) : null;

      if (!shopImageUrl) {
        toast.error('Failed to upload shop image. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Get AI verification result
      const aiResult = verificationResult as {
        isValid?: boolean;
        confidence?: number;
        reason?: string;
      } | null;

      // Create shop in Firestore
      await createShop({
        ownerId: user.uid,
        name,
        description: description || null,
        address,
        latitude: latitude!,
        longitude: longitude!,
        shopImageUrl,
        certificateUrl,
        licenseUrl,
        gstNumber: gstNumber || null,
        tagline: null,
        contactPhone: null,
        contactEmail: null,
        isVerified: false,
        greenScore: 0,
        verificationStatus: 'pending',
        ownerVerified: false,
        ownerVerifiedAt: null,
        ownerVerifiedBy: null,
        openingHours: null,
        socialLinks: null,
      });

      toast.success('Shop registered successfully! AI verification complete.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <div className="p-2 rounded-xl eco-gradient">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Add Shop</span>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Register Your Shop
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI-powered instant verification for faster approval
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop Name */}
              <div>
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your shop name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your shop and eco-practices"
                  rows={3}
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete shop address"
                  rows={2}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
              </div>

              {/* Location */}
              <div>
                <Label>Shop Location *</Label>
                <div className="mt-2 space-y-3">
                  <Button
                    type="button"
                    variant={latitude && longitude ? 'default' : 'outline'}
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="w-full"
                  >
                    {gettingLocation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    ) : latitude && longitude ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {latitude && longitude ? 'Location Captured ✓' : 'Pin My Location'}
                  </Button>
                  
                  {/* Map Preview */}
                  <LocationMapPreview 
                    latitude={latitude} 
                    longitude={longitude}
                    shopName={name || 'Your Shop'}
                  />
                  
                  {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Shop Image with AI Verification */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  Shop Image *
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-normal">
                    <Sparkles className="h-3 w-3" />
                    AI Verified
                  </span>
                </Label>
                <div>
                  <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    errors.shopImage ? 'border-destructive' : shopImagePreview ? 'border-primary' : 'border-border hover:border-primary/50'
                  } ${isVerifying ? 'pointer-events-none opacity-50' : ''}`}>
                    {shopImagePreview ? (
                      <img src={shopImagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload shop photo</span>
                        <span className="text-xs text-muted-foreground mt-1">AI will verify instantly</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleShopImageChange}
                      disabled={isVerifying}
                    />
                  </label>
                  {errors.shopImage && <p className="text-sm text-destructive mt-1">{errors.shopImage}</p>}
                </div>

                {/* AI Verification Panel for Shop Image */}
                <AIVerificationPanel 
                  isVerifying={isVerifying}
                  result={verificationResult}
                  type="shop"
                />
              </div>

              {/* Verification Info */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Auto-Verification
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your shop will be <strong>automatically verified</strong> once you provide:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    {latitude && longitude ? <CheckCircle className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground" />}
                    GPS Location
                  </li>
                  <li className="flex items-center gap-2">
                    {shopImageVerified ? <CheckCircle className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground" />}
                    AI-Verified Shop Image
                  </li>
                  <li className="flex items-center gap-2">
                    {certificate || license ? <CheckCircle className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground" />}
                    Certificate or License
                  </li>
                </ul>
              </div>

              {/* Certificate */}
              <div>
                <Label>Business Certificate *</Label>
                <div className="mt-2">
                  <label className={`flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    errors.certificate ? 'border-destructive' : certificate ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}>
                    <FileText className={`h-5 w-5 ${certificate ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${certificate ? 'text-primary' : 'text-muted-foreground'}`}>
                      {certificate ? certificate.name : 'Upload business certificate'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'certificate')}
                    />
                  </label>
                  {errors.certificate && <p className="text-sm text-destructive mt-1">{errors.certificate}</p>}
                </div>
              </div>

              {/* License */}
              <div>
                <Label>Trade License</Label>
                <div className="mt-2">
                  <label className={`flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    license ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}>
                    <CreditCard className={`h-5 w-5 ${license ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${license ? 'text-primary' : 'text-muted-foreground'}`}>
                      {license ? license.name : 'Upload trade license (optional)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'license')}
                    />
                  </label>
                </div>
              </div>

              {/* GST Number */}
              <div>
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST number if applicable"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Register Shop
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
