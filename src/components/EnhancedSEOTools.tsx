import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  FileText, 
  Globe, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Eye,
  Target,
  Zap,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateBingMeta, generateSitemapUrls, generateXMLSitemap, addStructuredData } from "@/lib/seo";

const EnhancedSEOTools = () => {
  const { toast } = useToast();
  
  // SEO Analysis State
  const [seoScore, setSeoScore] = useState(75);
  const [pageAnalysis, setPageAnalysis] = useState({
    title: { score: 85, issues: [] as string[] },
    description: { score: 90, issues: [] as string[] },
    headings: { score: 70, issues: ["Missing H2 tags", "H1 not optimized"] },
    images: { score: 60, issues: ["Missing alt text on 3 images"] },
    links: { score: 80, issues: ["Some external links missing rel attributes"] }
  });

  // Meta Tags State
  const [metaConfig, setMetaConfig] = useState({
    title: "",
    description: "",
    keywords: "",
    author: "Classifieds Connect",
    robots: "index, follow",
    canonical: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    twitterSite: "@classifiedsconnect"
  });

  // Sitemap State
  const [sitemapConfig, setSitemapConfig] = useState({
    includePages: true,
    includeAds: true,
    includeBlog: true,
    includeCategories: true,
    changeFreq: "weekly" as const,
    priority: "0.8"
  });

  // Schema.org State
  const [schemaConfig, setSchemaConfig] = useState({
    organizationName: "Classifieds Connect",
    organizationUrl: window.location.origin,
    organizationLogo: `${window.location.origin}/logo.png`,
    organizationType: "Corporation",
    enableBreadcrumbs: true,
    enableProducts: true,
    enableReviews: true
  });

  const [generatedSitemap, setGeneratedSitemap] = useState("");
  const [generatedMetaTags, setGeneratedMetaTags] = useState("");
  const [bingValidation, setBingValidation] = useState<any>(null);

  useEffect(() => {
    // Validate current page on component mount
    const validation = validateBingMeta();
    setBingValidation(validation);
    
    // Analyze current page SEO
    analyzeCurrentPage();
  }, []);

  const analyzeCurrentPage = () => {
    // Simulate SEO analysis
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1s = document.querySelectorAll('h1').length;
    const h2s = document.querySelectorAll('h2').length;
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;

    const titleScore = title.length > 30 && title.length < 60 ? 100 : 70;
    const descScore = description.length > 120 && description.length < 160 ? 100 : 70;
    
    setPageAnalysis({
      title: { 
        score: titleScore, 
        issues: titleScore < 100 ? ["Title should be 30-60 characters"] : []
      },
      description: { 
        score: descScore, 
        issues: descScore < 100 ? ["Description should be 120-160 characters"] : []
      },
      headings: { 
        score: h1s === 1 && h2s > 0 ? 100 : 70, 
        issues: h1s !== 1 ? ["Should have exactly one H1"] : h2s === 0 ? ["Missing H2 tags"] : []
      },
      images: { 
        score: imagesWithoutAlt === 0 ? 100 : 70, 
        issues: imagesWithoutAlt > 0 ? [`${imagesWithoutAlt} images missing alt text`] : []
      },
      links: { score: 80, issues: [] }
    });

    const avgScore = (titleScore + descScore + 80 + 70 + 80) / 5;
    setSeoScore(Math.round(avgScore));
  };

  const generateMetaTags = () => {
    const meta = `<!-- Primary Meta Tags -->
<title>${metaConfig.title}</title>
<meta name="title" content="${metaConfig.title}" />
<meta name="description" content="${metaConfig.description}" />
<meta name="keywords" content="${metaConfig.keywords}" />
<meta name="author" content="${metaConfig.author}" />
<meta name="robots" content="${metaConfig.robots}" />
${metaConfig.canonical ? `<link rel="canonical" href="${metaConfig.canonical}" />` : ''}

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${window.location.href}" />
<meta property="og:title" content="${metaConfig.ogTitle || metaConfig.title}" />
<meta property="og:description" content="${metaConfig.ogDescription || metaConfig.description}" />
${metaConfig.ogImage ? `<meta property="og:image" content="${metaConfig.ogImage}" />` : ''}

<!-- Twitter -->
<meta property="twitter:card" content="${metaConfig.twitterCard}" />
<meta property="twitter:url" content="${window.location.href}" />
<meta property="twitter:title" content="${metaConfig.ogTitle || metaConfig.title}" />
<meta property="twitter:description" content="${metaConfig.ogDescription || metaConfig.description}" />
${metaConfig.ogImage ? `<meta property="twitter:image" content="${metaConfig.ogImage}" />` : ''}
${metaConfig.twitterSite ? `<meta name="twitter:site" content="${metaConfig.twitterSite}" />` : ''}

<!-- Microsoft/Bing -->
<meta name="msapplication-TileColor" content="#000000" />
<meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />`;

    setGeneratedMetaTags(meta);
  };

  const generateSitemap = () => {
    // Mock data for sitemap generation
    const mockAds = [
      { id: "1", updated_at: new Date().toISOString() },
      { id: "2", updated_at: new Date().toISOString() }
    ];

    const urls = [];
    
    // Add static pages
    if (sitemapConfig.includePages) {
      urls.push(
        { url: `${window.location.origin}/`, lastmod: new Date().toISOString().split('T')[0], priority: "1.0", changefreq: "daily" },
        { url: `${window.location.origin}/about`, lastmod: new Date().toISOString().split('T')[0], priority: "0.8", changefreq: "monthly" },
        { url: `${window.location.origin}/faq`, lastmod: new Date().toISOString().split('T')[0], priority: "0.6", changefreq: "monthly" }
      );
    }

    // Add blog pages
    if (sitemapConfig.includeBlog) {
      urls.push(
        { url: `${window.location.origin}/blog`, lastmod: new Date().toISOString().split('T')[0], priority: "0.8", changefreq: "weekly" }
      );
    }

    // Add dynamic content
    if (sitemapConfig.includeAds) {
      const adUrls = generateSitemapUrls(mockAds);
      urls.push(...adUrls.map(url => ({ ...url, changefreq: sitemapConfig.changeFreq })));
    }

    const xmlSitemap = generateXMLSitemap(urls);
    setGeneratedSitemap(xmlSitemap);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const downloadSitemap = () => {
    if (!generatedSitemap) return;
    
    const blob = new Blob([generatedSitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Sitemap downloaded successfully",
    });
  };

  const generateSchema = () => {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": schemaConfig.organizationType,
      "name": schemaConfig.organizationName,
      "url": schemaConfig.organizationUrl,
      "logo": schemaConfig.organizationLogo
    };

    addStructuredData(organizationSchema);
    
    toast({
      title: "Schema Added",
      description: "Organization schema has been added to the page",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">SEO Tools & Analysis</h1>
        <p className="text-muted-foreground">Optimize your site for search engines and improve visibility</p>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="metatags">Meta Tags</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SEO Score
                  </CardTitle>
                  <CardDescription>Overall SEO health of your page</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{seoScore}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={seoScore} className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(pageAnalysis).map(([key, data]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <Badge variant={data.score >= 80 ? "default" : "destructive"}>
                        {data.score}%
                      </Badge>
                    </div>
                    {data.issues.length > 0 && (
                      <div className="space-y-1">
                        {data.issues.map((issue, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="h-3 w-3" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {bingValidation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Bing SEO Validation
                </CardTitle>
                <CardDescription>Microsoft/Bing specific optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {bingValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <span className={bingValidation.isValid ? "text-green-700" : "text-orange-700"}>
                    {bingValidation.isValid ? "Bing Optimized" : "Needs Optimization"}
                  </span>
                </div>
                {bingValidation.missingMeta.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Missing Meta Tags:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {bingValidation.missingMeta.map((meta: string, idx: number) => (
                        <li key={idx}>{meta}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metatags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Generator</CardTitle>
              <CardDescription>Generate optimized meta tags for your pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={metaConfig.title}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Page title (30-60 characters)"
                  />
                  <div className="text-xs text-muted-foreground">
                    {metaConfig.title.length}/60 characters
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="canonical">Canonical URL</Label>
                  <Input
                    id="canonical"
                    value={metaConfig.canonical}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, canonical: e.target.value }))}
                    placeholder="https://example.com/page"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Meta Description</Label>
                <Textarea
                  id="description"
                  value={metaConfig.description}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Page description (120-160 characters)"
                  rows={3}
                />
                <div className="text-xs text-muted-foreground">
                  {metaConfig.description.length}/160 characters
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={metaConfig.keywords}
                  onChange={(e) => setMetaConfig(prev => ({ ...prev, keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ogTitle">Open Graph Title</Label>
                  <Input
                    id="ogTitle"
                    value={metaConfig.ogTitle}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, ogTitle: e.target.value }))}
                    placeholder="Social media title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ogImage">Open Graph Image</Label>
                  <Input
                    id="ogImage"
                    value={metaConfig.ogImage}
                    onChange={(e) => setMetaConfig(prev => ({ ...prev, ogImage: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateMetaTags}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Meta Tags
                </Button>
                
                {generatedMetaTags && (
                  <Button variant="outline" onClick={() => copyToClipboard(generatedMetaTags, "Meta tags")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Tags
                  </Button>
                )}
              </div>

              {generatedMetaTags && (
                <div className="mt-4">
                  <Label>Generated Meta Tags:</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2">
                    {generatedMetaTags}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap Generator</CardTitle>
              <CardDescription>Generate an XML sitemap for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includePages"
                    checked={sitemapConfig.includePages}
                    onCheckedChange={(checked) => setSitemapConfig(prev => ({ ...prev, includePages: checked }))}
                  />
                  <Label htmlFor="includePages">Static Pages</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeAds"
                    checked={sitemapConfig.includeAds}
                    onCheckedChange={(checked) => setSitemapConfig(prev => ({ ...prev, includeAds: checked }))}
                  />
                  <Label htmlFor="includeAds">Ad Listings</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeBlog"
                    checked={sitemapConfig.includeBlog}
                    onCheckedChange={(checked) => setSitemapConfig(prev => ({ ...prev, includeBlog: checked }))}
                  />
                  <Label htmlFor="includeBlog">Blog Posts</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeCategories"
                    checked={sitemapConfig.includeCategories}
                    onCheckedChange={(checked) => setSitemapConfig(prev => ({ ...prev, includeCategories: checked }))}
                  />
                  <Label htmlFor="includeCategories">Categories</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateSitemap}>
                  <Globe className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </Button>
                
                {generatedSitemap && (
                  <>
                    <Button variant="outline" onClick={() => copyToClipboard(generatedSitemap, "Sitemap")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy XML
                    </Button>
                    
                    <Button variant="outline" onClick={downloadSitemap}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>

              {generatedSitemap && (
                <div className="mt-4">
                  <Label>Generated Sitemap (Preview):</Label>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2 max-h-96">
                    {generatedSitemap.substring(0, 1000)}...
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data (Schema.org)</CardTitle>
              <CardDescription>Configure structured data markup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={schemaConfig.organizationName}
                    onChange={(e) => setSchemaConfig(prev => ({ ...prev, organizationName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orgUrl">Organization URL</Label>
                  <Input
                    id="orgUrl"
                    value={schemaConfig.organizationUrl}
                    onChange={(e) => setSchemaConfig(prev => ({ ...prev, organizationUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableBreadcrumbs"
                    checked={schemaConfig.enableBreadcrumbs}
                    onCheckedChange={(checked) => setSchemaConfig(prev => ({ ...prev, enableBreadcrumbs: checked }))}
                  />
                  <Label htmlFor="enableBreadcrumbs">Enable Breadcrumb Schema</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableProducts"
                    checked={schemaConfig.enableProducts}
                    onCheckedChange={(checked) => setSchemaConfig(prev => ({ ...prev, enableProducts: checked }))}
                  />
                  <Label htmlFor="enableProducts">Enable Product Schema</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableReviews"
                    checked={schemaConfig.enableReviews}
                    onCheckedChange={(checked) => setSchemaConfig(prev => ({ ...prev, enableReviews: checked }))}
                  />
                  <Label htmlFor="enableReviews">Enable Review Schema</Label>
                </div>
              </div>

              <Button onClick={generateSchema}>
                <Zap className="h-4 w-4 mr-2" />
                Apply Schema Markup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Google Tools
                </CardTitle>
                <CardDescription>Essential Google SEO tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Google Search Console
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Google Analytics
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://pagespeed.web.dev" target="_blank" rel="noopener noreferrer">
                    <Zap className="h-4 w-4 mr-2" />
                    PageSpeed Insights
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Microsoft Tools
                </CardTitle>
                <CardDescription>Bing and Microsoft SEO tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Bing Webmaster Tools
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer">
                    <Target className="h-4 w-4 mr-2" />
                    Microsoft Clarity
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSEOTools;