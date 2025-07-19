import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const MetricCard = ({
  title,
  value,
  icon: IconComponent,
  description,
  trend,
  className,
  variant = 'default'
}: MetricCardProps) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
    warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800',
    destructive: 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    destructive: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-2">
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && (
            <Badge 
              variant={trend.direction === 'up' ? 'default' : 'destructive'}
              className="text-xs flex items-center gap-1"
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
              {trend.period && (
                <span className="ml-1 opacity-70">{trend.period}</span>
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;