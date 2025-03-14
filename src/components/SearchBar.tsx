
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (tailNumber: string) => void;
  isLoading?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading = false,
  className 
}) => {
  const [tailNumber, setTailNumber] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tailNumber.trim()) {
      onSearch(tailNumber.trim());
    }
  };

  return (
    <div className={cn("w-full max-w-lg mx-auto", className)}>
      <form 
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Enter aircraft tail number (e.g., N12345)"
            value={tailNumber}
            onChange={(e) => setTailNumber(e.target.value)}
            className="pr-20 h-14 rounded-2xl bg-white/80 backdrop-blur border border-white/40 shadow-sm text-lg transition-all focus-visible:ring-2 focus-visible:ring-red-400/20 focus-visible:border-red-400/30"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isLoading || !tailNumber.trim()}
            className="absolute right-2 h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 transition-all"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
              </>
            )}
          </Button>
        </div>
        <div className="absolute inset-0 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity blur-xl bg-red-500/10" />
      </form>
      <p className="text-xs text-muted-foreground mt-2 text-center animate-fade-in">
        Search for any aircraft by its tail/registration number
      </p>
    </div>
  );
};

export default SearchBar;
