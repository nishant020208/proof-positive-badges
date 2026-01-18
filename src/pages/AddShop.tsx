import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Leaf, ArrowLeft, MapPin, Upload, Store, FileText, CreditCard, Image, CheckCircle } from 'lucide-react';
import LocationMapPreview from '@/components/LocationMapPreview';
import { z } from 'zod';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5, 'Please enter a valid address').max(255),
  gstNumber: z.string().optional(),
});

export default function AddShop() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'shop' | 'certificate' | 'license') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    switch (type) {
      case 'shop':
        setShopImage(file);
        setShopImagePreview(URL.createObjectURL(file));
        break;
      case 'certificate':
        setCertificate(file);
        break;
      case 'license':
        setLicense(file);
        break;
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('shop-images')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('shop-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
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
    if (!validateForm() || !profile) return;

    setIsSubmitting(true);

    try {
      // Upload files
      const shopImageUrl = shopImage ? await uploadFile(shopImage, 'shops') : null;
      const certificateUrl = certificate ? await uploadFile(certificate, 'certificates') : null;
      const licenseUrl = license ? await uploadFile(license, 'licenses') : null;

      if (!shopImageUrl) {
        toast.error('Failed to upload shop image. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Create shop
      const { error } = await supabase.from('shops').insert({
        owner_id: profile.id,
        name,
        description: description || null,
        address,
        latitude: latitude!,
        longitude: longitude!,
        shop_image_url: shopImageUrl,
        certificate_url: certificateUrl,
        license_url: licenseUrl,
        gst_number: gstNumber || null,
        is_verified: false,
        verification_status: 'pending',
      });

      if (error) {
        toast.error('Failed to register shop. Please try again.');
        console.error(error);
      } else {
        toast.success('Shop registered successfully! It will be verified soon.');
        navigate('/');
      }
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Register Your Shop
            </CardTitle>
            <CardDescription>
              Fill in your shop details and upload required documents for verification
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
                    {shopImage ? <CheckCircle className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground" />}
                    Shop Image
                  </li>
                  <li className="flex items-center gap-2">
                    {certificate || license ? <CheckCircle className="h-3 w-3 text-green-500" /> : <span className="h-3 w-3 rounded-full border border-muted-foreground" />}
                    Certificate or License
                  </li>
                </ul>
              </div>

              {/* Shop Image */}
              <div>
                <Label>Shop Image *</Label>
                <div className="mt-2">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    errors.shopImage ? 'border-destructive' : 'border-border hover:border-primary/50'
                  }`}>
                    {shopImagePreview ? (
                      <img src={shopImagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Upload shop photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'shop')}
                    />
                  </label>
                  {errors.shopImage && <p className="text-sm text-destructive mt-1">{errors.shopImage}</p>}
                </div>
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
                <Label>Trade License *</Label>
                <div className="mt-2">
                  <label className={`flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    errors.license ? 'border-destructive' : license ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}>
                    <Upload className={`h-5 w-5 ${license ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${license ? 'text-primary' : 'text-muted-foreground'}`}>
                      {license ? license.name : 'Upload trade license'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'license')}
                    />
                  </label>
                  {errors.license && <p className="text-sm text-destructive mt-1">{errors.license}</p>}
                </div>
              </div>

              {/* GST Number */}
              <div>
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <div className="relative mt-1">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter GST number if applicable"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Register Shop'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your shop will be reviewed and verified within 24-48 hours
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
