import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Search, Filter, RotateCcw } from 'lucide-react';

interface OrderFiltersProps {
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  currentFilters: any;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  onFilterChange,
  onReset,
  currentFilters
}) => {
  const handleFilterChange = (key: string, value: string | number) => {
    onFilterChange({
      ...currentFilters,
      [key]: (value === 'all' || value === '') ? undefined : value
    });
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filter Orders</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="ml-auto"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={currentFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={currentFilters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={currentFilters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={currentFilters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Min Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Amount</label>
            <Input
              type="number"
              placeholder="$0"
              value={currentFilters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', parseFloat(e.target.value))}
            />
          </div>

          {/* Max Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Amount</label>
            <Input
              type="number"
              placeholder="$999999"
              value={currentFilters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};