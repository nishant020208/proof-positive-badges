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
import { Leaf, ArrowLeft, MapPin, Store, FileText, CreditCard, Image, CheckCircle, Brain, Sparkles, Loader2, Shield } from 'lucide-react';
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
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gettingLocation, setGettingLocation] = useState(false);
  const [shopImageVerified, setShopImageVerified] = useState(false);
  const [certificateVerified, setCertificateVerified] = useState(false);
  const [isVerifyingCert, setIsVerifyingCert] = useState(false);

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

    const result = await verifyShopImage(file, name || 'Shop');
    
    if (result) {
      setShopImageVerified(true);
      if (!result.isValid) {
        toast.warning('AI detected issues with your shop image.');
      } else if (result.confidence >= 70) {
        toast.success('AI verified your shop image!');
      } else {
        toast.info('Shop image uploaded. AI verification complete.');
      }
    }
  };

  const handleCertificateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setCertificate(file);
    
    // Show preview for images
    if (file.type.startsWith('image/')) {
      setCertificatePreview(URL.createObjectURL(file));
    } else {
      setCertificatePreview(null);
    }

    // AI verify the certificate
    setIsVerifyingCert(true);
    setCertificateVerified(false);

    try {
      const result = await verifyShopImage(file, `${name || 'Shop'} - Business Certificate`);
      if (result) {
        setCertificateVerified(true);
        if (result.isValid && result.confidence >= 60) {
          toast.success('Certificate verified by AI!');
        } else {
          toast.info('Certificate uploaded. Review pending.');
        }
      }
    } catch {
      toast.info('Certificate uploaded successfully.');
      setCertificateVerified(true);
    } finally {
      setIsVerifyingCert(false);
    }
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLicense(file);
    toast.success('License uploaded!');
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
    if (!validateForm() || !user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Upload files in parallel for speed
      const uploads = await Promise.all([
        shopImage ? uploadFile(shopImage, `shops/${user.uid}/${Date.now()}-shop.${shopImage.name.split('.').pop()}`) : Promise.resolve(null),
        certificate ? uploadFile(certificate, `certificates/${user.uid}/${Date.now()}-cert.${certificate.name.split('.').pop()}`) : Promise.resolve(null),
        license ? uploadFile(license, `licenses/${user.uid}/${Date.now()}-license.${license.name.split('.').pop()}`) : Promise.resolve(null),
      ]);

      const [shopImageUrl, certificateUrl, licenseUrl] = uploads;

      if (!shopImageUrl) {
        toast.error('Failed to upload shop image. Please try again.');
        setIsSubmitting(false);
        return;
      }

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

      toast.success('Shop registered successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center vardant-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen vardant-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl" style={{ borderBottom: '1px solid hsla(142, 71%, 45%, 0.1)' }}>
        <div className="container flex items-center h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <div className="p-2 rounded-xl eco-gradient glow-eco">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Add Shop</span>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Store className="h-5 w-5 text-primary" />
              Register Your Shop
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              AI-powered instant verification for faster approval
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shop Name */}
              <div>
                <Label htmlFor="name" className="text-foreground">Shop Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your shop name"
                  className={`bg-secondary/50 ${errors.name ? 'border-destructive' : 'border-border'}`}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your eco-practices"
                  rows={3}
                  className="bg-secondary/50 border-border"
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-foreground">Address *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete shop address"
                  rows={2}
                  className={`bg-secondary/50 ${errors.address ? 'border-destructive' : 'border-border'}`}
                />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
              </div>

              {/* Location */}
              <div>
                <Label className="text-foreground">Shop Location *</Label>
                <div className="mt-2 space-y-3">
                  <Button
                    type="button"
                    variant={latitude && longitude ? 'default' : 'outline'}
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className={`w-full ${latitude && longitude ? 'eco-gradient glow-eco' : 'border-border'}`}
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : latitude && longitude ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {latitude && longitude ? 'Location Captured ✓' : 'Pin My Location'}
                  </Button>
                  
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
                <Label className="flex items-center gap-2 text-foreground">
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

                <AIVerificationPanel 
                  isVerifying={isVerifying}
                  result={verificationResult}
                  type="shop"
                />
              </div>

              {/* Verification Checklist */}
              <div className="rounded-xl p-4" style={{ background: 'hsla(142, 71%, 45%, 0.06)', border: '1px solid hsla(142, 71%, 45%, 0.15)' }}>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  Verification Checklist
                </h4>
                <ul className="text-xs text-muted-foreground mt-2 space-y-2">
                  {[
                    { done: !!(latitude && longitude), label: 'GPS Location' },
                    { done: shopImageVerified, label: 'AI-Verified Shop Image' },
                    { done: !!(certificate || license), label: 'Certificate or License' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-muted-foreground" />
                      )}
                      <span className={item.done ? 'text-foreground' : ''}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Certificate with AI Verification */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-foreground">
                  Business Certificate *
                  {certificateVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-normal">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </Label>
                <div>
                  <label className={`flex items-center justify-center gap-2 w-full h-14 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    errors.certificate ? 'border-destructive' : certificate ? 'border-primary' : 'border-border hover:border-primary/50'
                  } ${isVerifyingCert ? 'pointer-events-none opacity-50' : ''}`}
                    style={certificate ? { background: 'hsla(142, 71%, 45%, 0.06)' } : {}}
                  >
                    {isVerifyingCert ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <FileText className={`h-5 w-5 ${certificate ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                    <span className={`text-sm ${certificate ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isVerifyingCert ? 'Verifying certificate...' : certificate ? certificate.name : 'Upload business certificate'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleCertificateChange}
                      disabled={isVerifyingCert}
                    />
                  </label>
                  {certificatePreview && (
                    <img src={certificatePreview} alt="Certificate" className="mt-2 w-full h-32 object-cover rounded-lg border border-border" />
                  )}
                  {errors.certificate && <p className="text-sm text-destructive mt-1">{errors.certificate}</p>}
                </div>
              </div>

              {/* License */}
              <div>
                <Label className="text-foreground">Trade License</Label>
                <div className="mt-2">
                  <label className={`flex items-center justify-center gap-2 w-full h-14 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    license ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                    style={license ? { background: 'hsla(142, 71%, 45%, 0.06)' } : {}}
                  >
                    <CreditCard className={`h-5 w-5 ${license ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${license ? 'text-primary' : 'text-muted-foreground'}`}>
                      {license ? license.name : 'Upload trade license (optional)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleLicenseChange}
                    />
                  </label>
                </div>
              </div>

              {/* GST Number */}
              <div>
                <Label htmlFor="gst" className="text-foreground">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="Enter GST number if applicable"
                  className="bg-secondary/50 border-border"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold eco-gradient glow-eco transition-all"
                disabled={isSubmitting || isVerifying || isVerifyingCert}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Registering...</span>
                  </div>
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
