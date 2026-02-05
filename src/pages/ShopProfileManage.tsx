 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
 import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
 import { db } from '@/lib/firebase';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Store, Package, Plus, Trash2, Edit, Save, Image, Tag, 
  DollarSign, Percent, Leaf, CheckCircle, AlertTriangle, X
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string;
  shop_image_url: string | null;
  owner_verified: boolean;
  green_score: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  discount_percentage: number | null;
  category: string | null;
  image_url: string | null;
  is_eco_friendly: boolean;
  eco_tags: string[];
  is_available: boolean;
}

export default function ShopProfileManage() {
  const navigate = useNavigate();
   const { user, profile } = useFirebaseAuth();
  
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Shop edit state
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  
  // Product dialog state
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discounted_price: '',
    category: '',
    is_eco_friendly: false,
    eco_tags: '',
    is_available: true,
  });

  useEffect(() => {
    fetchShopData();
   }, [user]);

  const fetchShopData = async () => {
     if (!user?.uid) return;

     try {
       const shopQuery = query(
         collection(db, 'shops'),
         where('ownerId', '==', user.uid)
       );
       const shopSnapshot = await getDocs(shopQuery);

       if (!shopSnapshot.empty) {
         const shopDoc = shopSnapshot.docs[0];
         const data = shopDoc.data();
         const shopData = {
           id: shopDoc.id,
           name: data.name,
           tagline: data.tagline || null,
           description: data.description || null,
           address: data.address,
           shop_image_url: data.shopImageUrl || null,
           owner_verified: data.ownerVerified || false,
           green_score: data.greenScore || data.green_score || 0,
         };
         
         setShop(shopData);
         setTagline(shopData.tagline || '');
         setDescription(shopData.description || '');

         // Fetch products
         const productsQuery = query(
           collection(db, 'shopProducts'),
           where('shopId', '==', shopDoc.id),
           orderBy('createdAt', 'desc')
         );
         const productsSnapshot = await getDocs(productsQuery);
         const productsData = productsSnapshot.docs.map(d => ({
           id: d.id,
           name: d.data().name,
           description: d.data().description || null,
           price: d.data().price,
           discounted_price: d.data().discountedPrice || null,
           discount_percentage: d.data().discountPercentage || null,
           category: d.data().category || null,
           image_url: d.data().imageUrl || null,
           is_eco_friendly: d.data().isEcoFriendly || false,
           eco_tags: d.data().ecoTags || [],
           is_available: d.data().isAvailable !== false,
         }));

         setProducts(productsData as Product[]);
       }
     } catch (error) {
       console.error('Error fetching shop data:', error);
    }

    setLoading(false);
  };

  const handleSaveShopInfo = async () => {
    if (!shop) return;
    setSaving(true);

     try {
       await updateDoc(doc(db, 'shops', shop.id), { 
         tagline, 
         description,
         updatedAt: serverTimestamp(),
       });
       toast.success('Shop info updated!');
     } catch (error) {
      toast.error('Failed to save changes');
    }
    setSaving(false);
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        discounted_price: product.discounted_price?.toString() || '',
        category: product.category || '',
        is_eco_friendly: product.is_eco_friendly,
        eco_tags: product.eco_tags?.join(', ') || '',
        is_available: product.is_available,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        discounted_price: '',
        category: '',
        is_eco_friendly: false,
        eco_tags: '',
        is_available: true,
      });
    }
    setProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!shop || !productForm.name || !productForm.price) {
      toast.error('Please fill in required fields');
      return;
    }

    const price = parseFloat(productForm.price);
    const discountedPrice = productForm.discounted_price ? parseFloat(productForm.discounted_price) : null;
    const discountPercentage = discountedPrice 
      ? Math.round(((price - discountedPrice) / price) * 100) 
      : null;

    const productData = {
       shopId: shop.id,
      name: productForm.name,
      description: productForm.description || null,
      price,
       discountedPrice: discountedPrice,
       discountPercentage: discountPercentage,
      category: productForm.category || null,
       isEcoFriendly: productForm.is_eco_friendly,
       ecoTags: productForm.eco_tags ? productForm.eco_tags.split(',').map(t => t.trim()) : [],
       isAvailable: productForm.is_available,
       updatedAt: serverTimestamp(),
    };

    if (editingProduct) {
       try {
         await updateDoc(doc(db, 'shopProducts', editingProduct.id), productData);
         toast.success('Product updated!');
         setProductDialog(false);
         fetchShopData();
       } catch (error) {
        toast.error('Failed to update product');
      }
    } else {
       try {
         await addDoc(collection(db, 'shopProducts'), {
           ...productData,
           createdAt: serverTimestamp(),
         });
         toast.success('Product added!');
         setProductDialog(false);
         fetchShopData();
       } catch (error) {
        toast.error('Failed to add product');
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
     try {
       await deleteDoc(doc(db, 'shopProducts', productId));
       toast.success('Product deleted');
       fetchShopData();
     } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-12 text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Shop Found</h2>
          <p className="text-muted-foreground mb-6">You haven't registered a shop yet.</p>
          <Button onClick={() => navigate('/add-shop')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {shop.shop_image_url ? (
              <img
                src={shop.shop_image_url}
                alt={shop.name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
                {shop.owner_verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <p className="text-muted-foreground">{shop.address}</p>
            </div>
          </div>

          {!shop.owner_verified && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Pending verification by admin</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="info" className="gap-2">
              <Store className="h-4 w-4" />
              Shop Info
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
              {products.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                  {products.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Shop Info */}
          <TabsContent value="info" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Shop Details</CardTitle>
                <CardDescription>Update your shop's tagline and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    placeholder="e.g., Your eco-friendly neighborhood store"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{tagline.length}/100 characters</p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Tell customers about your shop, your eco initiatives, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveShopInfo} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="space-y-6">
            {!shop.owner_verified ? (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Shop Not Verified</h3>
                  <p className="text-muted-foreground">
                    You can add products after your shop is verified by an admin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Products</h2>
                  <Button onClick={() => openProductDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {products.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first product to showcase it to customers
                      </p>
                      <Button onClick={() => openProductDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                      <Card key={product.id} className="border-border/50 overflow-hidden group">
                        <div className="relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-accent flex items-center justify-center">
                              <Package className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          
                          {product.discount_percentage && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              -{product.discount_percentage}%
                            </span>
                          )}

                          {product.is_eco_friendly && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Leaf className="h-3 w-3" />
                              Eco
                            </span>
                          )}

                          {!product.is_available && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-medium">Unavailable</span>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          {product.category && (
                            <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {product.discounted_price ? (
                              <>
                                <span className="text-lg font-bold text-primary">
                                  ₹{product.discounted_price}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{product.price}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold">₹{product.price}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openProductDialog(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                placeholder="e.g., Organic Cotton Bag"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Product description..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Discounted Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={productForm.discounted_price}
                  onChange={(e) => setProductForm({ ...productForm, discounted_price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g., Bags, Food, Clothing"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Eco-Friendly Product</Label>
                <p className="text-xs text-muted-foreground">Mark if this is an eco-friendly item</p>
              </div>
              <Switch
                checked={productForm.is_eco_friendly}
                onCheckedChange={(checked) => setProductForm({ ...productForm, is_eco_friendly: checked })}
              />
            </div>

            {productForm.is_eco_friendly && (
              <div className="space-y-2">
                <Label>Eco Tags (comma separated)</Label>
                <Input
                  placeholder="e.g., recyclable, organic, plastic-free"
                  value={productForm.eco_tags}
                  onChange={(e) => setProductForm({ ...productForm, eco_tags: e.target.value })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Available for Sale</Label>
                <p className="text-xs text-muted-foreground">Toggle if product is in stock</p>
              </div>
              <Switch
                checked={productForm.is_available}
                onCheckedChange={(checked) => setProductForm({ ...productForm, is_available: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Update' : 'Add'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
