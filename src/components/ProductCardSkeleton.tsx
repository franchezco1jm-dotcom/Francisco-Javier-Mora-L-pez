import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between animate-pulse"
        >
          <div className="flex gap-3">
            {/* Image Placeholder */}
            <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0" />

            {/* Info Placeholder */}
            <div className="flex-1 min-w-0 space-y-2 py-1">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800/70 rounded w-1/2" />
              <div className="h-4 bg-purple-900/40 rounded w-1/3 mt-2" />
            </div>
          </div>

          {/* Action Row Placeholder */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <div className="h-3 bg-slate-800/60 rounded w-20" />
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800/70" />
              <div className="w-7 h-7 rounded-lg bg-slate-800/70" />
              <div className="w-7 h-7 rounded-lg bg-slate-800/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
