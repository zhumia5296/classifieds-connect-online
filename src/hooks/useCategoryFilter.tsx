import { createContext, useContext, useState, ReactNode } from 'react';

interface CategoryContextType {
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategoryFilter = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryFilter must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider = ({ children }: CategoryProviderProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <CategoryContext.Provider value={{
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </CategoryContext.Provider>
  );
};