'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';

interface SearchableDropdownProps {
  options?: Array<{ id: number; key: string; value: string }>;
  value?: number | number[];
  onChange: (value: number | number[] | undefined) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  displayFullValue?: boolean;
  isEmployeePage?: boolean;
  isMultiSelect?: boolean;
  showSelectAll?: boolean;
  usePortal?: boolean;
  onSearch?: (searchTerm: string) => Promise<Array<{ id: number; key: string; value: string }>>;
  minSearchLength?: number;
  initialSelectedOptions?: Array<{ id: number; key: string; value: string }>;
  allowRemove?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  required = false,
  className = "",
  disabled = false,
  maxDisplayItems = 10,
  displayFullValue = true,
  isEmployeePage = false,
  isMultiSelect = false,
  showSelectAll = false,
  usePortal = false,
  onSearch,
  minSearchLength = 3,
  initialSelectedOptions = [],
  allowRemove = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: number; key: string; value: string }>>([]);
  const [allLoadedOptions, setAllLoadedOptions] = useState<Array<{ id: number; key: string; value: string }>>(initialSelectedOptions);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uniqueIdRef = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`);

  const selectedValues = useMemo(() => {
    if (isMultiSelect) {
      return Array.isArray(value) ? value : [];
    }
    return value !== undefined ? [value as number] : [];
  }, [value, isMultiSelect]);

  const allAvailableOptions = useMemo(() => {
    const combined = [...allLoadedOptions];
    
    if (options.length > 0) {
      options.forEach(opt => {
        if (!combined.some(o => o.id === opt.id)) {
          combined.push(opt);
        }
      });
    }
    
    return combined;
  }, [allLoadedOptions, options]);

  const selectedOptions = useMemo(() => {
    return allAvailableOptions.filter(option => selectedValues.includes(option.id));
  }, [allAvailableOptions, selectedValues]);

  useEffect(() => {
    if (initialSelectedOptions.length > 0) {
      setAllLoadedOptions(prevOptions => {
        const newOptions = [...prevOptions];
        initialSelectedOptions.forEach(opt => {
          if (!newOptions.some(o => o.id === opt.id)) {
            newOptions.push(opt);
          }
        });
        return newOptions;
      });
    }
  }, [initialSelectedOptions]);

  // Calculate and update dropdown position
  const updateDropdownPosition = () => {
    if (dropdownRef.current && usePortal && isOpen) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const newPosition = {
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      };
      
      // Only update if position actually changed (avoid infinite loops)
      setDropdownPosition(prev => {
        if (prev.top !== newPosition.top || prev.left !== newPosition.left || prev.width !== newPosition.width) {
          return newPosition;
        }
        return prev;
      });
    }
  };

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (usePortal && isOpen) {
      updateDropdownPosition();
      
      // Update position on scroll within modal or window
      const handleScroll = (e: Event) => {
        // Check if scrolling is happening in a modal
        const target = e.target as HTMLElement;
        if (target.classList?.contains('overflow-y-auto')) {
          updateDropdownPosition();
        }
      };

      const handleResize = () => {
        updateDropdownPosition();
      };

      // Listen to both window scroll and all scroll events in capture phase
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      // Use MutationObserver to detect DOM changes that might affect position
      const observer = new MutationObserver(updateDropdownPosition);
      if (dropdownRef.current) {
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true 
        });
      }

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }
  }, [usePortal, isOpen]);

  useEffect(() => {
    if (!onSearch || !isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length < minSearchLength) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await onSearch(searchTerm);
        
        setAllLoadedOptions(prevOptions => {
          const combined = [...prevOptions];
          results.forEach(result => {
            if (!combined.some(opt => opt.id === result.id)) {
              combined.push(result);
            }
          });
          return combined;
        });
        
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, onSearch, isOpen, minSearchLength]);

  const filteredOptions = useMemo(() => {
    if (onSearch) {
      if (searchTerm.length < minSearchLength) {
        // When not searching, show selected options if they exist
        if (selectedOptions.length > 0) {
          return selectedOptions;
        }
        return [];
      }
      return searchResults.slice(0, maxDisplayItems);
    }
    
    const filtered = allAvailableOptions.filter(option =>
      option.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.slice(0, maxDisplayItems);
  }, [allAvailableOptions, searchTerm, maxDisplayItems, onSearch, minSearchLength, searchResults, selectedOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is on the main dropdown container
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      
      // Check if click is on the portal dropdown menu
      if (usePortal && dropdownMenuRef.current && dropdownMenuRef.current.contains(target)) {
        return;
      }
      
      // Close dropdown if clicked outside
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [usePortal]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  const handleSelectOption = (option: { id: number; key: string; value: string }) => {
    if (isMultiSelect) {
      const newValues = Array.isArray(value) ? [...value] : [];
      if (newValues.includes(option.id)) {
        const filtered = newValues.filter(id => id !== option.id);
        onChange(filtered.length > 0 ? filtered : undefined);
      } else {
        onChange([...newValues, option.id]);
      }
    } else {
      onChange(option.id);
      setIsOpen(false);
    }
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange(undefined);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSelectAll = () => {
    if (!isMultiSelect || onSearch) return;
    const allIds = allAvailableOptions.map(opt => opt.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange(undefined);
  };

  const handleRemoveItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(val => val !== id);
    onChange(newValues.length > 0 ? newValues : undefined);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const dropdownContent = (
    <div 
      ref={dropdownMenuRef}
      className="bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
      style={usePortal ? {
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 9999,
      } : undefined}
    >
      {onSearch && searchTerm && searchTerm.length < minSearchLength && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/50">
          <Search size={12} className="inline mr-1" />
          Type {minSearchLength - searchTerm.length} more character{minSearchLength - searchTerm.length > 1 ? 's' : ''} to search...
        </div>
      )}

      {isSearching && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/50 flex items-center">
          <Loader2 size={12} className="inline mr-2 animate-spin" />
          Searching...
        </div>
      )}

      {onSearch && searchTerm.length >= minSearchLength && !isSearching && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/50">
          <Search size={12} className="inline mr-1" />
          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchTerm}"
        </div>
      )}

      {!required && allowRemove && (
        <div
          role="option"
          tabIndex={0}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-muted-foreground border-b border-border"
          onClick={handleClear}
        >
          <span className="italic">Clear selection</span>
        </div>
      )}

      {showSelectAll && isMultiSelect && !onSearch && allAvailableOptions.length > 0 && (
        <div
          role="option"
          tabIndex={0}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-primary font-medium border-b border-border"
          onClick={() => {
            if (selectedValues.length === allAvailableOptions.length) {
              handleDeselectAll();
            } else {
              handleSelectAll();
            }
          }}
        >
          {selectedValues.length === allAvailableOptions.length ? (
            <>
              <X size={14} className="inline mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <Check size={14} className="inline mr-2" />
              Select All ({allAvailableOptions.length})
            </>
          )}
        </div>
      )}

      {filteredOptions.length > 0 ? (
        filteredOptions.map((option, index) => {
          const isSelected = selectedValues.includes(option.id);
          return (
            <div
              key={option.id}
              role="option"
              tabIndex={0}
              aria-selected={isSelected}
              className={`
                px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between
                ${highlightedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}
                ${isSelected ? 'bg-primary/5 font-medium' : ''}
              `}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div>
                {isEmployeePage ? (
                  <div className="font-medium">{option.key}</div>
                ) : (
                  <>
                    <div className="font-medium">{option.key}</div>
                    <div className="text-xs text-muted-foreground">{option.value}</div>
                  </>
                )}
              </div>
              {isSelected && <Check size={16} className="text-primary" />}
            </div>
          );
        })
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {onSearch && searchTerm.length < minSearchLength 
            ? selectedOptions.length > 0 
              ? 'Type to search for more options'
              : `Type ${minSearchLength}+ characters to search`
            : isSearching 
            ? 'Searching...'
            : searchTerm.length >= minSearchLength
            ? 'No results found'
            : 'No options available'}
        </div>
      )}

      {onSearch && searchResults.length > maxDisplayItems && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
          Showing first {maxDisplayItems} of {searchResults.length} results. Refine your search for more specific results.
        </div>
      )}
      
      {!onSearch && allAvailableOptions.length > maxDisplayItems && filteredOptions.length === maxDisplayItems && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
          Showing {maxDisplayItems} of {allAvailableOptions.length} items. Type to filter more.
        </div>
      )}
    </div>
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`} id={uniqueIdRef.current}>
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
            placeholder={onSearch ? `Type ${minSearchLength}+ characters to search...` : "Type to search..."}
            className="flex-1 bg-transparent outline-none"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <div className="flex-1 flex flex-wrap items-center gap-1">
            {selectedOptions.length > 0 ? (
              isMultiSelect ? (
                <>
                  {selectedOptions[0] && (
                    <div key={selectedOptions[0].id} className="inline-flex items-center gap-1 bg-secondary rounded-full px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                      {selectedOptions[0].value}
                      {allowRemove && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(e, selectedOptions[0].id)}
                          className="ml-1 p-0.5 rounded-full hover:bg-muted"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  )}

                  {selectedOptions.length > 1 && (
                    <span className="text-sm text-muted-foreground">
                      +{selectedOptions.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm">
                  {displayFullValue ? `${selectedOptions[0].key} (${selectedOptions[0].value})` : selectedOptions[0].value}
                </span>
              )
            ) : (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 ml-1">
          {selectedOptions.length > 0 && !required && allowRemove && !disabled && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:bg-muted rounded-sm"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}
             ${selectedOptions.length > 0 && !isOpen ? '' : 'opacity-0'}`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        usePortal && typeof document !== 'undefined' ? (
          createPortal(dropdownContent, document.body)
        ) : (
          <div className="absolute z-50 w-full mt-1">
            {dropdownContent}
          </div>
        )
      )}
    </div>
  );
};

export default SearchableDropdown;