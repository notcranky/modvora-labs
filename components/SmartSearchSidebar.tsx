'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FilterState {
  search: string
  make: string
  model: string
  minHp: number | null
  maxHp: number | null
  minBudget: number | null
  maxBudget: number | null
  tags: string[]
  status: 'all' | 'in-progress' | 'completed'
  sort: 'newest' | 'popular' | 'hp-high' | 'hp-low' | 'budget-high' | 'budget-low'
}

interface SmartSearchSidebarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onApply: () => void
  onReset: () => void
  resultCount: number
  className?: string
}

const POPULAR_MAKES = ['Toyota', 'BMW', 'Honda', 'Subaru', 'Nissan', 'Ford', 'Chevy', 'Audi', 'VW', 'Mazda', 'Porsche', 'Mercedes']
const POPULAR_TAGS = ['turbo', 'supercharged', 'stance', 'track', 'daily', 'sleeper', 'restomod', 'drift', 'drag', 'showcar']

export default function SmartSearchSidebar({ 
  filters, 
  onChange, 
  onApply, 
  onReset, 
  resultCount,
  className = '' 
}: SmartSearchSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value })
  }
  
  const toggleTag = (tag: string) => {
    const current = filters.tags
    const updated = current.includes(tag) 
      ? current.filter(t => t !== tag)
      : [...current, tag]
    updateFilter('tags', updated)
  }
  
  const activeFilterCount = [
    filters.make,
    filters.model,
    filters.minHp,
    filters.maxHp,
    filters.minBudget,
    filters.maxBudget,
    ...filters.tags,
    filters.status !== 'all' ? filters.status : null,
    filters.sort !== 'newest' ? filters.sort : null,
  ].filter(Boolean).length
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-[#1e1e24]/50 flex items-center justify-between cursor-pointer hover:bg-[#18181f] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-purple-400" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h3 className="font-semibold text-white text-sm">Smart Search</h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-xs">
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg 
          viewBox="0 0 24 24" 
          className={`h-4 w-4 fill-none stroke-zinc-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} 
          strokeWidth={2}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search builds..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:outline-none transition-colors"
            />
            <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 fill-none stroke-zinc-500" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          
          {/* Make Selection */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Make</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => updateFilter('make', '')}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  !filters.make 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-[#18181f] text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              {POPULAR_MAKES.map(make => (
                <button
                  key={make}
                  onClick={() => updateFilter('make', make)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.make === make 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {make}
                </button>
              ))}
            </div>
          </div>
          
          {/* Horsepower Range */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Horsepower</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="Min HP"
                  value={filters.minHp || ''}
                  onChange={(e) => updateFilter('minHp', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600">HP</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Max HP"
                  value={filters.maxHp || ''}
                  onChange={(e) => updateFilter('maxHp', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600">HP</span>
              </div>
            </div>
          </div>
          
          {/* Budget Range */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Budget Spent</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minBudget || ''}
                  onChange={(e) => updateFilter('minBudget', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 pl-6 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxBudget || ''}
                  onChange={(e) => updateFilter('maxBudget', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 pl-6 text-sm text-white placeholder-zinc-600 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Build Style</label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30' 
                      : 'bg-[#18181f] text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Build Status</label>
            <div className="flex gap-2">
              {(['all', 'in-progress', 'completed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => updateFilter('status', status)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filters.status === status
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : 'Completed'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Sort By</label>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value as FilterState['sort'])}
              className="w-full bg-[#0a0a0e] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="hp-high">HP: High to Low</option>
              <option value="hp-low">HP: Low to High</option>
              <option value="budget-high">Budget: High to Low</option>
              <option value="budget-low">Budget: Low to High</option>
            </select>
          </div>
          
          {/* Actions */}
          <div className="pt-3 border-t border-[#1e1e24]/50 space-y-2">
            <button
              onClick={onApply}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Show {resultCount} Results
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="w-full py-2 text-zinc-500 hover:text-white text-sm transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export type { FilterState }
