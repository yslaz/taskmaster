import React from 'react';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error = false,
  minDate,
  maxDate,
}) => {
  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      // Convert to ISO string for API
      const date = new Date(dateValue);
      onChange(date.toISOString());
    } else {
      onChange('');
    }
  };

  const inputValue = formatDateForInput(value);
  const displayValue = formatDateForDisplay(value);

  return (
    <div className="relative">
      <input
        type="date"
        value={inputValue}
        onChange={handleDateChange}
        disabled={disabled}
        min={minDate}
        max={maxDate}
        className={`input ${error ? 'error' : ''} ${disabled ? 'opacity-60' : ''}`}
        placeholder={placeholder}
      />
      
      {/* Display formatted date */}
      {displayValue && !disabled && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-secondary-900 text-sm bg-white pr-2">
          </span>
        </div>
      )}
      
      {/* Clear button */}
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-secondary-700"
          title="Clear date"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Helper component for date with time
interface DateTimePickerProps extends DatePickerProps {
  includeTime?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  includeTime = false,
  ...props
}) => {
  if (!includeTime) {
    return <DatePicker {...props} />;
  }

  // For datetime-local input type
  const formatDateTimeForInput = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateTimeValue = e.target.value;
    if (dateTimeValue) {
      // Convert to ISO string for API
      const date = new Date(dateTimeValue);
      props.onChange(date.toISOString());
    } else {
      props.onChange('');
    }
  };

  return (
    <div className="relative">
      <input
        type="datetime-local"
        value={formatDateTimeForInput(props.value)}
        onChange={handleDateTimeChange}
        disabled={props.disabled}
        min={props.minDate}
        max={props.maxDate}
        className={`input ${props.error ? 'error' : ''} ${props.disabled ? 'opacity-60' : ''}`}
        placeholder={props.placeholder}
      />
      
      {/* Clear button */}
      {props.value && !props.disabled && (
        <button
          type="button"
          onClick={() => props.onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-secondary-700"
          title="Clear date"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};