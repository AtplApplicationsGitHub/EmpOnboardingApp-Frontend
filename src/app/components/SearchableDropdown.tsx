'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface SearchableDropdownProps {
  options: Array<{ id: number; key: string; value: string }>;
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
  onNextPage?: () => void;
  onPrevPage?: () => void;
  currentPage?: number;
  totalPages?: number;
  hasNextPage?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  required = false,
  className = "",
  disabled = false,
  maxDisplayItems = 4,
  displayFullValue = true,
  isEmployeePage = false,
  isMultiSelect = false,
  showSelectAll = false,
  onNextPage,
  onPrevPage,
  currentPage,
  totalPages,
  hasNextPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert the value to an array of selected IDs
  const selectedValues = useMemo(() => {
    if (isMultiSelect) {
      return Array.isArray(value) ? value : [];
    }
    return value !== undefined ? [value as number] : [];
  }, [value, isMultiSelect]);

  // Find selected option
  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option.id));
  }, [options, selectedValues]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, maxDisplayItems);
  }, [options, searchTerm, maxDisplayItems]);

  const isAllSelected = useMemo(() => {
    return isMultiSelect && selectedValues.length === options.length && options.length > 0;
  }, [isMultiSelect, selectedValues, options]);

  // Update dropdown position when opened or on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updatePosition();

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside the dropdown ref or the portal dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Check if the click target or any of its parents have the dropdown menu class
        const clickedElement = event.target as HTMLElement;
        const isInsideDropdownMenu = clickedElement.closest('.dropdown-menu-portal');
        
        if (!isInsideDropdownMenu) {
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
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

  // Selects/deselects an option (multi = toggle, single = choose + close)
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

  // Selects or deselects all options in multi-select mode
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      onChange(undefined);
    } else {
      // Select all
      const allIds = options.map(opt => opt.id);
      onChange(allIds);
    }
    setSearchTerm('');
    setHighlightedIndex(-1);
  };
  // Clears all selected options
  const handleClear = () => {
    onChange(undefined);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Removes a single selected item in multi-select mode
  const handleRemoveItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(val => val !== id);
    onChange(newValues.length > 0 ? newValues : undefined);
  };

  // Opens dropdown when input is clicked
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Dropdown menu content
  const dropdownMenu = isOpen && !disabled && (
    <div 
      className="dropdown-menu-portal fixed bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 9999,
      }}
    >
      {/* Search hint when typing */}
      {searchTerm && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/50">
          <Search size={12} className="inline mr-1" />
          Searching for "{searchTerm}"...
        </div>
      )}

      {/* Select All Option (only for multi-select with showSelectAll) */}
      {isMultiSelect && showSelectAll && !searchTerm && (
        <div
          role="option"
          tabIndex={0}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-muted font-semibold border-b border-border bg-primary/5 flex items-center justify-between"
          onClick={handleSelectAll}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectAll();
            }
          }}
        >
          <span className="text-primary">
            {isAllSelected ? '✓ Deselect All' : 'Select All'}
          </span>
          {isAllSelected && <Check size={16} className="text-primary" />}
        </div>
      )}

      {/* Clear option (if not required) */}
      {!required && (
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
          No options available
        </div>
      )}

      {options.length > maxDisplayItems && filteredOptions.length === maxDisplayItems && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
          Showing {maxDisplayItems} of {options.length} items. Type to filter more.
        </div>
      )}

      {/* Pagination Controls */}
      {(onNextPage || onPrevPage) && (
        <div className="sticky bottom-0 bg-background border-t border-border px-3 py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevPage?.();
            }}
            disabled={currentPage === 0}
            className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {(currentPage ?? 0) + 1} {totalPages ? `of ${totalPages}` : ''}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNextPage?.();
            }}
            disabled={!hasNextPage}
            className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );

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
          <div className="flex-1 flex flex-wrap items-center gap-1">
            {selectedOptions.length > 0 ? (
              isMultiSelect ? (
                <>
                  {/* Display the first selected option */}
                  {selectedOptions[0] && (
                    <div key={selectedOptions[0].id} className="inline-flex items-center gap-1 bg-secondary rounded-full px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                      {selectedOptions[0].value}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(e, selectedOptions[0].id)}
                        className="ml-1 p-0.5 rounded-full hover:bg-muted"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}

                  {/* Display the count of additional selected options */}
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
          {selectedOptions.length > 0 && !required && !disabled && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className=" hover:bg-muted rounded-sm"
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

      {/* Dropdown Menu using Portal */}
      {mounted && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default SearchableDropdown;