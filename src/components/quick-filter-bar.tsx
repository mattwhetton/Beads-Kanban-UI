'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type TypeFilter = 'all' | 'epics' | 'tasks';
type SortField = 'ticket_number' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface QuickFilterBarProps {
  /** Issue type filter: all, epics, or tasks */
  typeFilter: TypeFilter;
  /** Callback when type filter changes */
  onTypeFilterChange: (type: TypeFilter) => void;
  /** Whether to show only today's active items */
  todayOnly: boolean;
  /** Callback when today's active toggle changes */
  onTodayOnlyChange: (value: boolean) => void;
  /** Field to sort by */
  sortField: SortField;
  /** Sort direction */
  sortDirection: SortDirection;
  /** Callback when sort changes */
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'epics', label: 'Epics' },
  { value: 'tasks', label: 'Tasks' },
];

const SORT_OPTIONS: { value: string; label: string; field: SortField; direction: SortDirection }[] = [
  { value: 'ticket_number_desc', label: 'Ticket # (Newest)', field: 'ticket_number', direction: 'desc' },
  { value: 'ticket_number_asc', label: 'Ticket # (Oldest)', field: 'ticket_number', direction: 'asc' },
  { value: 'created_at_desc', label: 'Created (Newest)', field: 'created_at', direction: 'desc' },
  { value: 'created_at_asc', label: 'Created (Oldest)', field: 'created_at', direction: 'asc' },
];

/**
 * QuickFilterBar provides quick access to common filter and sort operations
 * for the kanban board. Displays below the header as a horizontal bar.
 */
export function QuickFilterBar({
  typeFilter,
  onTypeFilterChange,
  todayOnly,
  onTodayOnlyChange,
  sortField,
  sortDirection,
  onSortChange,
}: QuickFilterBarProps) {
  const currentSortValue = `${sortField}_${sortDirection}`;

  const handleSortChange = (value: string) => {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    if (option) {
      onSortChange(option.field, option.direction);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Quick filters"
      className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2"
    >
      {/* Type Filter - Segmented Control */}
      <div
        role="radiogroup"
        aria-label="Filter by issue type"
        className="flex items-center bg-zinc-800/50 rounded-md p-0.5"
      >
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={typeFilter === option.value}
            onClick={() => onTypeFilterChange(option.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
              typeFilter === option.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-transparent text-zinc-300 hover:text-zinc-200'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Today's Active Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTodayOnlyChange(!todayOnly)}
        aria-pressed={todayOnly}
        className={cn(
          'transition-colors',
          todayOnly
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
            : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
        )}
      >
        Today&apos;s Active
      </Button>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2 ml-auto">
        <span aria-hidden="true" className="text-sm text-zinc-500">Sort:</span>
        <Select value={currentSortValue} onValueChange={handleSortChange}>
          <SelectTrigger
            aria-label="Sort by"
            className="w-[160px] h-8 bg-zinc-800/50 border-zinc-700 text-zinc-200 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export type { QuickFilterBarProps, TypeFilter, SortField, SortDirection };
