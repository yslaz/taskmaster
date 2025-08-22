import React, { useState, useRef, useCallback } from 'react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badges?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Accordion: React.FC<AccordionProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = '',
  badges,
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  
  // Stable function to handle toggle
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isControlled && onToggle) {
      onToggle();
    } else if (!isControlled) {
      setInternalIsOpen(prev => !prev);
    }
  }, [isControlled, onToggle]);

  return (
    <div className={`accordion ${className}`} style={{ 
      border: '1px solid var(--color-border)', 
      borderRadius: '0.5rem',
      backgroundColor: 'var(--color-surface)',
      marginBottom: '0rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <button
        className="accordion-header"
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: 'none',
          borderRadius: isOpen ? '0.5rem 0.5rem 0 0' : '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          transition: 'background-color 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span>{title}</span>
          {badges && (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {badges}
            </div>
          )}
        </div>
        <svg
          style={{
            width: '1rem',
            height: '1rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          ref={contentRef}
          className="accordion-content accordion-body"
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--color-border)',
            borderRadius: '0 0 0.5rem 0.5rem'
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
