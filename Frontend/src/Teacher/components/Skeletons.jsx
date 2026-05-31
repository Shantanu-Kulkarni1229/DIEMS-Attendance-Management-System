import React from 'react'

export const SkeletonCard = ({className = ''}) => (
  <div className={`rounded-md p-4 bg-slate-200 dark:bg-slate-700 animate-pulse ${className}`}></div>
)

export const SkeletonTableRow = ({cols = 6}) => (
  <div className="w-full flex items-center gap-4 py-2">
    {Array.from({length: cols}).map((_, i) => (
      <div key={i} className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
    ))}
  </div>
)

export const ButtonSpinner = ({size = 4}) => (
  <svg className={`animate-spin text-white dark:text-gray-200 h-${size} w-${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
)

export default null
