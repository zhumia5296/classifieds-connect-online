import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import LocationInput from '@/components/LocationInput';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  MapPin, 
  DollarSign, 
  Calendar as CalendarIcon,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Star,
  Crown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  condition: string;
  location: string;
  latitude?: number;
  longitude?: number;
  contact_phone: string;
  contact_email: string;
  category_id: string;
  expires_at: Date | undefined;
  feature_option: 'none' | '7days' | '30days';
}

const PostAd = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // SEO for post ad page
  useSEO({
    title: "Post Your Ad - Sell Items Online | Classifieds Connect",
    description: "Create your free classified ad on Classifieds Connect. Reach thousands of potential buyers by posting your item for sale with photos and detailed descriptions.",
    keywords: "post ad, sell items, create listing, classified ad, marketplace, free ad"
  });
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    condition: '',
    location: '',
    contact_phone: '',
    contact_email: user?.email || '',
    category_id: '',
    expires_at: undefined,
    feature_option: 'none'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('is_active', true)
        .order('name');
      
      if (data && !error) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  // Update contact email when user changes
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, contact_email: user.email }));
    }
  }, [user]);

  const handleInputChange = (field: keyof FormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 5;
    
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images per ad.`,
        variant: "destructive"
      });
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Images must be smaller than 5MB.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (formData.price && (isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      newErrors.price = 'Please enter a valid price';
    }
    
    if (formData.contact_phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Please enter a valid phone number';
    }
    
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for validation errors.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create the ad
      const adData = {
        user_id: user!.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price ? Number(formData.price) : null,
        currency: formData.currency,
        condition: formData.condition,
        location: formData.location.trim(),
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        contact_phone: formData.contact_phone.trim() || null,
        contact_email: formData.contact_email.trim(),
        category_id: formData.category_id,
        expires_at: formData.expires_at?.toISOString() || null
      };

      const { data: ad, error: adError } = await supabase
        .from('ads')
        .insert(adData)
        .select()
        .single();

      if (adError) throw adError;

      // Upload images if any
      if (images.length > 0) {
        const imageUploads = images.map(async (image, index) => {
          const fileExt = image.name.split('.').pop();
          const fileName = `${ad.id}-${index}.${fileExt}`;
          
          // Note: In a real app, you'd upload to Supabase Storage
          // For now, we'll use placeholder URLs
          const imageUrl = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop`;
          
          return {
            ad_id: ad.id,
            image_url: imageUrl,
            alt_text: formData.title,
            is_primary: index === 0,
            sort_order: index
          };
        });

        const imageData = await Promise.all(imageUploads);
        
        const { error: imageError } = await supabase
          .from('ad_images')
          .insert(imageData);

        if (imageError) {
          console.error('Error uploading images:', imageError);
          // Don't fail the whole operation for image errors
        }
      }

      let successMessage = "Your ad is now live and visible to other users.";
      let adId = ad.id;

      // Handle featuring if selected
      if (formData.feature_option !== 'none') {
        const durationDays = formData.feature_option === '7days' ? 7 : 30;
        
        try {
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke('feature-ad-payment', {
            body: { ad_id: ad.id, duration_days: durationDays }
          });

          if (paymentError) throw paymentError;

          // Open payment in new tab and show different success message
          window.open(paymentData.url, '_blank');
          successMessage = "Ad posted! Complete payment to feature your ad.";
        } catch (error) {
          console.error('Error creating feature payment:', error);
          toast({
            title: "Ad posted successfully",
            description: "However, there was an issue setting up the feature payment. You can feature your ad later from the dashboard.",
            variant: "default"
          });
          navigate('/dashboard');
          return;
        }
      }

      toast({
        title: "Ad posted successfully!",
        description: successMessage,
      });

      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Error posting ad",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Post Your Ad</h1>
            <p className="text-muted-foreground">
              Reach thousands of potential buyers by posting your item for sale.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell us about what you're selling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="What are you selling?"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => handleInputChange('category_id', value)}
                    >
                      <SelectTrigger className={errors.category_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCategories.map((category) => {
                          const subcategories = getSubcategories(category.id);
                          return (
                            <div key={category.id}>
                              <SelectItem value={category.id}>
                                {category.name}
                              </SelectItem>
                              {subcategories.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id} className="pl-6">
                                  → {sub.name}
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.category_id && (
                      <p className="text-sm text-destructive">{errors.category_id}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Include key details like brand, model, age, and condition
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Details */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Details</CardTitle>
                <CardDescription>
                  Set your price and item condition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={`pl-10 ${errors.price ? 'border-destructive' : ''}`}
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">
                      Condition <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.condition} 
                      onValueChange={(value) => handleInputChange('condition', value)}
                    >
                      <SelectTrigger className={errors.condition ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Item condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.condition && (
                      <p className="text-sm text-destructive">{errors.condition}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expires_at && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expires_at ? (
                          format(formData.expires_at, "PPP")
                        ) : (
                          <span>Pick an expiration date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expires_at}
                        onSelect={(date) => handleInputChange('expires_at', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground">
                    Your ad will be automatically removed after this date
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Upload up to 5 images of your item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB each</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={images.length >= 5}
                      />
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-1 left-1 text-xs"
                            >
                              Primary
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Location</CardTitle>
                <CardDescription>
                  How buyers can reach you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <LocationInput
                    value={formData.location}
                    onChange={(location, coords) => {
                      handleInputChange('location', location);
                      if (coords) {
                        setFormData(prev => ({
                          ...prev,
                          latitude: coords.latitude,
                          longitude: coords.longitude
                        }));
                      }
                    }}
                    label="Location"
                    placeholder="Enter your city or location"
                    required
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone Number</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      className={errors.contact_phone ? 'border-destructive' : ''}
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-destructive">{errors.contact_phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="your-email@example.com"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className={errors.contact_email ? 'border-destructive' : ''}
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive">{errors.contact_email}</p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your contact information will be visible to interested buyers. 
                    Make sure it's accurate and up to date.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Feature Ad Option */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Feature Your Ad
                </CardTitle>
                <CardDescription>
                  Get more visibility by featuring your ad at the top of search results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div 
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      formData.feature_option === 'none' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => handleInputChange('feature_option', 'none')}
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold">No Feature</h4>
                      <p className="text-2xl font-bold">Free</p>
                      <p className="text-sm text-muted-foreground">Standard listing</p>
                    </div>
                    {formData.feature_option === 'none' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-background rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      formData.feature_option === '7days' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => handleInputChange('feature_option', '7days')}
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold">7 Days Featured</h4>
                      <p className="text-2xl font-bold">$7</p>
                      <p className="text-sm text-muted-foreground">Great for quick sales</p>
                    </div>
                    {formData.feature_option === '7days' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-background rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                      formData.feature_option === '30days' ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => handleInputChange('feature_option', '30days')}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">30 Days Featured</h4>
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                      <p className="text-2xl font-bold">$30</p>
                      <p className="text-sm text-muted-foreground">Best value & exposure</p>
                    </div>
                    {formData.feature_option === '30days' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-background rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formData.feature_option !== 'none' && (
                  <Alert>
                    <Crown className="h-4 w-4" />
                    <AlertDescription>
                      Featured ads appear at the top of search results with highlighted styling and get up to 5x more views than regular ads.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={loading}
                className="sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-32 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {formData.feature_option !== 'none' ? 'Posting & Setting Up Payment...' : 'Posting...'}
                  </>
                ) : (
                  <>
                    {formData.feature_option !== 'none' ? (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Post & Feature Ad
                      </>
                    ) : (
                      'Post Ad'
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostAd;