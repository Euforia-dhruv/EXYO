import { memo } from 'react';
import { cn } from '../utils/helpers';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
  shimmer?: boolean;
}

export function Skeleton({
  className,
  variant = 'rect',
  width,
  height,
  shimmer = true,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-exyo-elevated overflow-hidden',
        variant === 'circle' && 'rounded-full',
        variant === 'rounded' && 'rounded-xl',
        variant === 'text' && 'rounded-md',
        variant === 'rect' && 'rounded-lg',
        shimmer && 'shimmer',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export const PosterSkeleton = memo(function PosterSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl shimmer',
      size === 'sm' ? 'w-[130px] sm:w-[150px] aspect-[2/3]' : 'w-[180px] sm:w-[220px] md:w-[240px] aspect-[2/3]'
    )}>
      <div className="absolute inset-0 bg-exyo-elevated" />
      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
        <div className="h-3 bg-white/10 rounded w-3/4 mb-1.5" />
        <div className="h-2 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
});

export const HeroSkeleton = memo(function HeroSkeleton() {
  return (
    <div className="w-full h-[55vh] sm:h-[65vh] lg:h-[75vh] min-h-[400px] bg-exyo-card shimmer">
      <div className="absolute inset-0 bg-gradient-to-t from-exyo-bg via-transparent to-transparent" />
      <div className="absolute bottom-16 sm:bottom-20 lg:bottom-24 left-6 lg:left-10 max-w-[540px]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-6 w-16 bg-white/10 rounded-lg" />
          <div className="h-6 w-12 bg-white/5 rounded-lg" />
          <div className="h-6 w-14 bg-white/5 rounded-lg" />
        </div>
        <div className="h-12 sm:h-16 w-3/4 bg-white/10 rounded-xl mb-3" />
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 w-36 bg-white/10 rounded-xl" />
          <div className="h-14 w-32 bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
});

export const RowSkeleton = memo(function RowSkeleton() {
  return (
    <div className="mb-8 px-1">
      <div className="h-6 w-40 bg-white/10 rounded-lg mb-4" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

export const SearchSkeleton = memo(function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

export const DetailSkeleton = memo(function DetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[60vh] shimmer">
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-bg via-exyo-bg/50 to-transparent z-10" />
        <div className="absolute bottom-0 inset-x-0 z-20 px-6 lg:px-10 pb-8 max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
            <div className="w-40 sm:w-48 aspect-[2/3] bg-white/10 rounded-xl hidden lg:block" />
            <div className="flex-1 max-w-[600px]">
              <div className="h-4 w-20 bg-white/10 rounded mb-3" />
              <div className="h-10 sm:h-14 w-3/4 bg-white/10 rounded-xl mb-3" />
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-12 bg-white/5 rounded" />
                <div className="h-5 w-16 bg-white/5 rounded" />
                <div className="h-5 w-14 bg-white/5 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content rows */}
      <div className="px-6 lg:px-10 max-w-[1440px] mx-auto mt-10">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
});
