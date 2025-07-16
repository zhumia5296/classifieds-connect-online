import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertCircle, Globe, Search, FileText } from "lucide-react";
import { validateBingMeta, generateXMLSitemap, generateSitemapUrls } from "@/lib/seo";
import { toast } from "sonner";

const SEOTools = () => {
  const [bingValidation, setBingValidation] = useState<any>(null);
  const [sitemapXML, setSitemapXML] = useState("");
  const [metaPreview, setMetaPreview] = useState({
    title: "",
    description: "",
    keywords: "",
    bingVerification: ""
  });

  useEffect(() => {
    // Validate current page for Bing
    const validation = validateBingMeta();
    setBingValidation(validation);
    
    // Generate sitemap preview
    const mockAds = [
      { id: "1", updated_at: new Date().toISOString() },
      { id: "2", updated_at: new Date().toISOString() }
    ];
    const urls = generateSitemapUrls(mockAds);
    const xml = generateXMLSitemap(urls);
    setSitemapXML(xml);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const generateMetaTags = () => {
    const tags = `
<!-- Microsoft/Bing SEO Meta Tags -->
<meta name="msvalidate.01" content="${metaPreview.bingVerification}" />
<meta name="bingbot" content="index, follow" />
<meta name="msnbot" content="index, follow" />
<meta name="title" content="${metaPreview.title}" />
<meta name="description" content="${metaPreview.description}" />
<meta name="keywords" content="${metaPreview.keywords}" />
<meta name="msapplication-TileColor" content="#3b82f6" />
<meta name="msapplication-config" content="/browserconfig.xml" />

<!-- Open Graph for Microsoft -->
<meta property="og:title" content="${metaPreview.title}" />
<meta property="og:description" content="${metaPreview.description}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com/icons/icon-512x512.png" />
    `.trim();
    
    return tags;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Microsoft SEO Tools</h1>
        <p className="text-muted-foreground">Optimize your site for Bing and Microsoft services</p>
      </div>

      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="metatags" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Meta Tags
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Bing SEO Validation
              </CardTitle>
              <CardDescription>
                Check if your site meets Bing's SEO requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bingValidation && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {bingValidation.isValid ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Issues Found
                      </Badge>
                    )}
                  </div>

                  {!bingValidation.isValid && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">Missing Meta Tags:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {bingValidation.missingMeta.map((meta: string) => (
                              <li key={meta} className="text-sm">{meta}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {bingValidation.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Recommendations:</h4>
                      <ul className="space-y-1">
                        {bingValidation.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metatags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Generator</CardTitle>
              <CardDescription>
                Generate Microsoft/Bing optimized meta tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={metaPreview.title}
                    onChange={(e) => setMetaPreview(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter page title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bingVerification">Bing Verification Code</Label>
                  <Input
                    id="bingVerification"
                    value={metaPreview.bingVerification}
                    onChange={(e) => setMetaPreview(prev => ({ ...prev, bingVerification: e.target.value }))}
                    placeholder="Enter Bing verification code"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Meta Description</Label>
                <Textarea
                  id="description"
                  value={metaPreview.description}
                  onChange={(e) => setMetaPreview(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter meta description (150-160 characters)"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {metaPreview.description.length}/160 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={metaPreview.keywords}
                  onChange={(e) => setMetaPreview(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="space-y-2">
                <Label>Generated Meta Tags</Label>
                <div className="relative">
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{generateMetaTags()}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateMetaTags(), "Meta tags")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap</CardTitle>
              <CardDescription>
                Microsoft/Bing optimized sitemap with proper formatting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Generated Sitemap XML</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(sitemapXML, "Sitemap XML")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy XML
                  </Button>
                </div>
                <div className="relative max-h-96 overflow-y-auto">
                  <pre className="text-xs bg-muted p-4 rounded-md">
                    <code>{sitemapXML}</code>
                  </pre>
                </div>
              </div>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Save this as <code>sitemap.xml</code> in your public folder and submit to Bing Webmaster Tools.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bing Webmaster Tools</CardTitle>
                <CardDescription>
                  Submit your site to Bing for indexing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open("https://www.bing.com/webmasters", "_blank")}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Open Bing Webmaster Tools
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Microsoft Clarity</CardTitle>
                <CardDescription>
                  Add user behavior analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open("https://clarity.microsoft.com", "_blank")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Open Microsoft Clarity
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">URL Inspection</CardTitle>
                <CardDescription>
                  Test how Bing sees your pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open("https://www.bing.com/webmasters/url-inspection", "_blank")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test URL
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bing Search Console</CardTitle>
                <CardDescription>
                  Monitor search performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open("https://www.bing.com/webmasters/reports", "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOTools;