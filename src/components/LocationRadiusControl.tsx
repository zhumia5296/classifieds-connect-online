import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Target } from "lucide-react";

interface LocationRadiusControlProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  unit?: 'km' | 'miles';
  onUnitChange?: (unit: 'km' | 'miles') => void;
  disabled?: boolean;
  className?: string;
  showPresets?: boolean;
  showCustomInput?: boolean;
}

const LocationRadiusControl: React.FC<LocationRadiusControlProps> = ({
  radius,
  onRadiusChange,
  unit = 'km',
  onUnitChange,
  disabled = false,
  className = '',
  showPresets = true,
  showCustomInput = false
}) => {
  const maxRadius = unit === 'km' ? 100 : 62; // 100km or ~62 miles
  const step = unit === 'km' ? 1 : 1;

  const presetDistances = unit === 'km' 
    ? [1, 5, 10, 25, 50, 100]
    : [1, 3, 6, 15, 31, 62];

  const formatDistance = (distance: number) => {
    return `${distance}${unit}`;
  };

  const handlePresetClick = (distance: number) => {
    onRadiusChange(distance);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-primary" />
          Search Radius
        </Label>
        {onUnitChange && (
          <Select value={unit} onValueChange={onUnitChange} disabled={disabled}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="km">km</SelectItem>
              <SelectItem value="miles">mi</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current radius display */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <div className="text-lg font-semibold text-primary">
          {formatDistance(radius)}
        </div>
        <div className="text-xs text-muted-foreground">
          Search within this distance
        </div>
      </div>

      {/* Slider control */}
      <div className="px-2">
        <Slider
          value={[radius]}
          onValueChange={(values) => onRadiusChange(values[0])}
          max={maxRadius}
          min={1}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1{unit}</span>
          <span>{maxRadius}{unit}</span>
        </div>
      </div>

      {/* Preset buttons */}
      {showPresets && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Select</Label>
          <div className="grid grid-cols-3 gap-2">
            {presetDistances.map((distance) => (
              <Button
                key={distance}
                variant={radius === distance ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handlePresetClick(distance)}
                disabled={disabled}
              >
                {formatDistance(distance)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom input */}
      {showCustomInput && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Custom Distance</Label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={maxRadius}
              value={radius}
              onChange={(e) => {
                const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), maxRadius);
                onRadiusChange(value);
              }}
              disabled={disabled}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Distance"
            />
            <span className="flex items-center text-sm text-muted-foreground">
              {unit}
            </span>
          </div>
        </div>
      )}

      {/* Distance info */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
        <MapPin className="h-3 w-3 inline mr-1" />
        Showing results within {formatDistance(radius)} of your location
      </div>
    </div>
  );
};

export default LocationRadiusControl;