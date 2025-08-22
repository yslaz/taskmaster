import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, trimmedTag]);
    }
    
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className={`border rounded-md p-2 ${disabled ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
          >
            #{tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-primary-200 rounded-full p-0.5"
                aria-label={`Remove ${tag} tag`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </span>
        ))}
      </div>

      {!disabled && tags.length < maxTags && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : 'Add another tag...'}
          className="w-full border-0 outline-none text-sm bg-transparent"
        />
      )}

      {tags.length >= maxTags && (
        <p className="text-xs text-muted mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}

      <p className="text-xs text-muted mt-1">
        Press Enter or comma to add tags
      </p>
    </div>
  );
};