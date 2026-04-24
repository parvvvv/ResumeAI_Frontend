import { createContext, useContext, useState } from 'react';

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  isSearchOpen: false,
  setIsSearchOpen: () => {},
});

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
