export interface ComparisonField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'price' | 'select' | 'date';
  unit?: string;
  options?: string[];
  important?: boolean; // Highlight important differences
}

export interface CategoryComparisonConfig {
  categorySlug: string;
  categoryName: string;
  fields: ComparisonField[];
}

export const categoryComparisonConfigs: CategoryComparisonConfig[] = [
  {
    categorySlug: 'vehicles',
    categoryName: 'Vehicles',
    fields: [
      { key: 'make', label: 'Make', type: 'text', important: true },
      { key: 'model', label: 'Model', type: 'text', important: true },
      { key: 'year', label: 'Year', type: 'number', important: true },
      { key: 'mileage', label: 'Mileage', type: 'number', unit: 'miles' },
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] },
      { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic', 'CVT'] },
      { key: 'engine_size', label: 'Engine Size', type: 'text', unit: 'L' },
      { key: 'doors', label: 'Doors', type: 'number' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'vin', label: 'VIN', type: 'text' }
    ]
  },
  {
    categorySlug: 'electronics',
    categoryName: 'Electronics',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', important: true },
      { key: 'model', label: 'Model', type: 'text', important: true },
      { key: 'screen_size', label: 'Screen Size', type: 'text', unit: '"' },
      { key: 'storage', label: 'Storage', type: 'text', unit: 'GB' },
      { key: 'ram', label: 'RAM', type: 'text', unit: 'GB' },
      { key: 'processor', label: 'Processor', type: 'text' },
      { key: 'operating_system', label: 'Operating System', type: 'text' },
      { key: 'warranty', label: 'Warranty', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'accessories_included', label: 'Accessories Included', type: 'text' }
    ]
  },
  {
    categorySlug: 'furniture',
    categoryName: 'Furniture',
    fields: [
      { key: 'material', label: 'Material', type: 'text', important: true },
      { key: 'dimensions', label: 'Dimensions', type: 'text', important: true },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'style', label: 'Style', type: 'text' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'assembly_required', label: 'Assembly Required', type: 'boolean' },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
      { key: 'room_type', label: 'Room Type', type: 'select', options: ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Kitchen', 'Bathroom'] }
    ]
  },
  {
    categorySlug: 'real-estate',
    categoryName: 'Real Estate',
    fields: [
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'], important: true },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', important: true },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number', important: true },
      { key: 'square_feet', label: 'Square Feet', type: 'number', unit: 'sq ft' },
      { key: 'lot_size', label: 'Lot Size', type: 'text' },
      { key: 'year_built', label: 'Year Built', type: 'number' },
      { key: 'parking', label: 'Parking', type: 'text' },
      { key: 'heating', label: 'Heating', type: 'text' },
      { key: 'cooling', label: 'Cooling', type: 'text' },
      { key: 'hoa_fees', label: 'HOA Fees', type: 'price', unit: '/month' }
    ]
  },
  {
    categorySlug: 'clothing',
    categoryName: 'Clothing',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', important: true },
      { key: 'size', label: 'Size', type: 'text', important: true },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'material', label: 'Material', type: 'text' },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] },
      { key: 'season', label: 'Season', type: 'select', options: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season'] },
      { key: 'care_instructions', label: 'Care Instructions', type: 'text' }
    ]
  },
  {
    categorySlug: 'sports',
    categoryName: 'Sports & Recreation',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', important: true },
      { key: 'sport_type', label: 'Sport', type: 'text', important: true },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'lbs' },
      { key: 'material', label: 'Material', type: 'text' },
      { key: 'skill_level', label: 'Skill Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'] },
      { key: 'age_group', label: 'Age Group', type: 'select', options: ['Kids', 'Teen', 'Adult', 'Senior', 'All Ages'] }
    ]
  }
];

export const getComparisonFieldsForCategory = (categoryName: string): ComparisonField[] => {
  const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '-');
  
  // Try exact match first
  let config = categoryComparisonConfigs.find(c => c.categorySlug === normalizedCategory);
  
  // Try partial matches for common categories
  if (!config) {
    if (normalizedCategory.includes('car') || normalizedCategory.includes('vehicle') || normalizedCategory.includes('auto')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'vehicles');
    } else if (normalizedCategory.includes('phone') || normalizedCategory.includes('computer') || normalizedCategory.includes('electronic')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'electronics');
    } else if (normalizedCategory.includes('furniture') || normalizedCategory.includes('home')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'furniture');
    } else if (normalizedCategory.includes('house') || normalizedCategory.includes('apartment') || normalizedCategory.includes('property')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'real-estate');
    } else if (normalizedCategory.includes('clothing') || normalizedCategory.includes('apparel') || normalizedCategory.includes('fashion')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'clothing');
    } else if (normalizedCategory.includes('sport') || normalizedCategory.includes('fitness') || normalizedCategory.includes('recreation')) {
      config = categoryComparisonConfigs.find(c => c.categorySlug === 'sports');
    }
  }
  
  return config ? config.fields : getDefaultComparisonFields();
};

export const getDefaultComparisonFields = (): ComparisonField[] => [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'color', label: 'Color', type: 'text' },
  { key: 'dimensions', label: 'Dimensions', type: 'text' },
  { key: 'weight', label: 'Weight', type: 'text' },
  { key: 'material', label: 'Material', type: 'text' },
  { key: 'features', label: 'Key Features', type: 'text' }
];

export const formatFieldValue = (value: any, field: ComparisonField): string => {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }
  
  if (field.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (field.type === 'number' && field.unit) {
    return `${value} ${field.unit}`;
  }
  
  if (field.type === 'price') {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? value : `$${numValue.toLocaleString()}${field.unit || ''}`;
  }
  
  return String(value);
};