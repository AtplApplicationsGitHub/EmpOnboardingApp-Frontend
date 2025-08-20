import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableDropdownProps {
  options: Array<{ id: number; key: string; value: string }>;
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  displayFullValue?: boolean;
  isEmployeePage?: boolean;
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find(option => option.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, maxDisplayItems);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
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

  const handleSelectOption = (option: { id: number; key: string; value: string }) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange(undefined);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
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
  // Conditionally render based on the new prop
  <span>
    {displayFullValue ? `${selectedOption.key} (${selectedOption.value})` : selectedOption.value}
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
              Searching for "{searchTerm}"...
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
                {isEmployeePage ? (
  <div className="font-medium">
    {option.key}
  </div>
) : (
  <>
    <div className="font-medium">
      {option.key}
    </div>
    <div className="text-xs text-muted-foreground">
      {option.value}
    </div>
  </>
)}

              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchTerm ? 'No group leaders found' : 'No group leaders available'}
            </div>
          )}

          {/* Show count if there are more items */}
          {options.length > maxDisplayItems && filteredOptions.length === maxDisplayItems && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
              Showing {maxDisplayItems} of {options.length} group leaders. Type to filter more.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
