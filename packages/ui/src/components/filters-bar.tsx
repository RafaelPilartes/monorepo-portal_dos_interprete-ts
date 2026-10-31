import { Search, Filter, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    name: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function FiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  filters = [],
  onClearFilters,
  hasActiveFilters = false,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.name}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={filter.name} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        
        {hasActiveFilters && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
