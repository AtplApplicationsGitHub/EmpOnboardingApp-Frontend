import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';

interface SearchableDropdownProps {
  options?: Array<{ id: number; name: string; email: string }>; // Made optional for async mode
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  // Async search props
  enableAsyncSearch?: boolean;
  onSearch?: (searchTerm: string) => Promise<Array<{ id: number; name: string; email: string }>>;
  minimumSearchLength?: number;
  // Pre-selected option (useful for edit forms where we have an ID but need to fetch the user details)
  initialSelectedOption?: { id: number; name: string; email: string };
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  required = false,
  className = "",
  disabled = false,
  maxDisplayItems = 4,
  enableAsyncSearch = false,
  onSearch,
  minimumSearchLength = 3,
  initialSelectedOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOptionCache, setSelectedOptionCache] = useState<{ id: number; name: string; email: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected option (look in options, searchResults, and cache)
  let selectedOption: { id: number; name: string; email: string } | undefined;
  if (value) {
    // First try to find in current options/search results
    const allOptions = enableAsyncSearch ? searchResults : options;
    selectedOption = allOptions.find(option => option.id === value);
    
    // If not found but we have a cached version, use that
    if (!selectedOption && selectedOptionCache && selectedOptionCache.id === value) {
      selectedOption = selectedOptionCache;
    }
  }

  // Handle async search
  const performSearch = useCallback(async (term: string) => {
    if (!enableAsyncSearch || !onSearch) return;
    
    console.log('SearchableDropdown performSearch called with:', { term, length: term.length, minimumSearchLength });
    
    if (term.length < minimumSearchLength) {
      console.log('Term too short, clearing results');
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Calling onSearch with term:', term);
      const results = await onSearch(term);
      console.log('Search results received:', results);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [enableAsyncSearch, onSearch, minimumSearchLength]);

  // Debounce search
  useEffect(() => {
    if (!enableAsyncSearch) return;
    
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch, enableAsyncSearch]);

  // Clear cache when value changes externally (e.g., form reset)
  useEffect(() => {
    if (!value) {
      setSelectedOptionCache(null);
    }
  }, [value]);

  // Set initial selected option if provided
  useEffect(() => {
    if (initialSelectedOption && value === initialSelectedOption.id) {
      setSelectedOptionCache(initialSelectedOption);
    }
  }, [initialSelectedOption, value]);

  // Filter options based on search term (for non-async mode)
  const filteredOptions = enableAsyncSearch 
    ? searchResults 
    : options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, maxDisplayItems);

  // For async mode, only show options if we have searched and have results
  const shouldShowOptions = enableAsyncSearch 
    ? (hasSearched && searchTerm.length >= minimumSearchLength && searchResults.length > 0)
    : filteredOptions.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!enableAsyncSearch) {
          setSearchTerm('');
        }
        setHighlightedIndex(-1);
        if (enableAsyncSearch) {
          setSearchResults([]);
          setHasSearched(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [enableAsyncSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (shouldShowOptions && filteredOptions.length > 0) {
            setHighlightedIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (shouldShowOptions && filteredOptions.length > 0) {
            setHighlightedIndex(prev => 
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (shouldShowOptions && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          if (!enableAsyncSearch) {
            setSearchTerm('');
          }
          setHighlightedIndex(-1);
          if (enableAsyncSearch) {
            setSearchResults([]);
            setHasSearched(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, shouldShowOptions, enableAsyncSearch]);

  const handleSelectOption = (option: { id: number; name: string; email: string }) => {
    onChange(option.id);
    setSelectedOptionCache(option); // Cache the selected option
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    if (enableAsyncSearch) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setSelectedOptionCache(null); // Clear the cached option
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (enableAsyncSearch) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      if (!enableAsyncSearch) {
        setSearchTerm('');
      } else {
        // In async mode, if we have a selected option and no search results, 
        // we can start with the selected option's name as search term
        if (selectedOption && searchResults.length === 0 && !hasSearched) {
          setSearchTerm(selectedOption.name);
        }
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchResults]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div 
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className={`
          flex items-center w-full px-3 py-2 border border-input bg-background rounded-md 
          focus-within:outline-none focus-within:ring-2 focus-within:ring-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-primary' : ''}
        `}
        onClick={handleInputClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleInputClick();
          }
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
            className="flex-1 bg-transparent outline-none"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <div className="flex-1 text-sm">
            {selectedOption ? (
              <span>
                {selectedOption.name}
                {selectedOption.email && ` (${selectedOption.email})`}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-1 ml-2">
          {selectedOption && !required && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-muted rounded-sm"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search hint when typing */}
          {searchTerm && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/50">
              <Search size={12} className="inline mr-1" />
              {enableAsyncSearch ? (
                searchTerm.length < minimumSearchLength ? (
                  `Type at least ${minimumSearchLength} characters to search...`
                ) : isSearching ? (
                  <>
                    <Loader2 size={12} className="inline mr-1 animate-spin" />
                    Searching for "{searchTerm}"...
                  </>
                ) : (
                  `Search results for "${searchTerm}"`
                )
              ) : (
                `Searching for "${searchTerm}"...`
              )}
            </div>
          )}
          
          {/* Show search prompt for async mode when no search term */}
          {enableAsyncSearch && !searchTerm && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              <Search size={16} className="inline mr-2" />
              Type at least {minimumSearchLength} characters to search for users
            </div>
          )}
          
          {/* Show message when search term is too short for async mode */}
          {enableAsyncSearch && searchTerm && searchTerm.length < minimumSearchLength && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              <Search size={16} className="inline mr-2" />
              Type {minimumSearchLength - searchTerm.length} more character{minimumSearchLength - searchTerm.length !== 1 ? 's' : ''} to search
            </div>
          )}
          
          {/* Clear option (if not required and has selection) */}
          {!required && selectedOption && !enableAsyncSearch && (
            <div
              role="option"
              tabIndex={0}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-muted-foreground border-b border-border"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear();
                }
              }}
            >
              <span className="italic">Clear selection</span>
            </div>
          )}

          {/* Options */}
          {shouldShowOptions ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                role="option"
                tabIndex={0}
                aria-selected={selectedOption?.id === option.id}
                className={`
                  px-3 py-2 text-sm cursor-pointer transition-colors
                  ${highlightedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                  ${selectedOption?.id === option.id ? 'bg-primary/5 font-medium' : ''}
                `}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectOption(option);
                  }
                }}
              >
                <div className="font-medium">{option.name}</div>
                {option.email && (
                  <div className="text-xs text-muted-foreground">{option.email}</div>
                )}
              </div>
            ))
          ) : (
            // Show "no results" message only when we've searched and found nothing
            enableAsyncSearch && hasSearched && searchTerm.length >= minimumSearchLength && searchResults.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No users found for "{searchTerm}"
              </div>
            )
          )}

          {/* Show count if there are more items (non-async mode) */}
          {!enableAsyncSearch && options.length > maxDisplayItems && filteredOptions.length === maxDisplayItems && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
              Showing {maxDisplayItems} of {options.length} items. Type to filter more.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
