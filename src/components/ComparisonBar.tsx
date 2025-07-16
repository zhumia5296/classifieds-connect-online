import { useState } from 'react';
import { X, Scale, ArrowRight, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useComparison } from '@/hooks/useComparison';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ComparisonBar = () => {
  const { 
    comparisonAds, 
    savedComparisons, 
    removeFromComparison, 
    clearComparison, 
    saveComparison, 
    loadComparison, 
    deleteComparison 
  } = useComparison();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const navigate = useNavigate();

  if (comparisonAds.length === 0) {
    return null;
  }

  const handleCompare = () => {
    navigate('/compare');
  };

  const handleSave = async () => {
    if (comparisonName.trim()) {
      await saveComparison(comparisonName.trim());
      setComparisonName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoad = async (comparisonId: string) => {
    await loadComparison(comparisonId);
    setShowLoadDialog(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-semibold">Compare Ads</span>
              <Badge variant="secondary">
                {comparisonAds.length}/3
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
              >
                {isExpanded ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearComparison}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {comparisonAds.map((ad) => (
                <div key={ad.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{ad.title}</h4>
                    <p className="text-xs text-muted-foreground">{ad.price}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromComparison(ad.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {comparisonAds.length < 2 
                  ? `Add ${2 - comparisonAds.length} more ad${2 - comparisonAds.length === 1 ? '' : 's'} to compare`
                  : 'Ready to compare!'
                }
              </div>
              
              {user && (
                <div className="flex gap-1">
                  {/* Save Comparison */}
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Comparison</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter comparison name..."
                          value={comparisonName}
                          onChange={(e) => setComparisonName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSave} disabled={!comparisonName.trim()}>
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Load Comparison */}
                  <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <FolderOpen className="h-3 w-3" />
                        Load
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Load Saved Comparison</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {savedComparisons.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No saved comparisons found.
                          </p>
                        ) : (
                          savedComparisons.map((comparison) => (
                            <div
                              key={comparison.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <h4 className="font-medium">{comparison.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {comparison.ad_ids.length} ads • {new Date(comparison.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleLoad(comparison.id)}
                                >
                                  Load
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteComparison(comparison.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleCompare}
              disabled={comparisonAds.length < 2}
              className="gap-2"
            >
              Compare Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonBar;