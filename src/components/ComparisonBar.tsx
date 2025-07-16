import { useState } from 'react';
import { X, Scale, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComparison } from '@/hooks/useComparison';
import { useNavigate } from 'react-router-dom';

const ComparisonBar = () => {
  const { comparisonAds, removeFromComparison, clearComparison } = useComparison();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (comparisonAds.length === 0) {
    return null;
  }

  const handleCompare = () => {
    navigate('/compare');
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
            <div className="text-sm text-muted-foreground">
              {comparisonAds.length < 2 
                ? `Add ${2 - comparisonAds.length} more ad${2 - comparisonAds.length === 1 ? '' : 's'} to compare`
                : 'Ready to compare!'
              }
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