export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-40 md:w-52">
      <div className="aspect-video bg-exyo-secondary rounded animate-pulse" />
      <div className="mt-2 space-y-2">
        <div className="h-4 bg-exyo-secondary rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-exyo-secondary rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="mb-8">
      <div className="h-6 bg-exyo-secondary rounded w-48 mb-4 ml-4 md:ml-12 animate-pulse" />
      <div className="flex gap-2 px-4 md:px-12 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[80vh] w-full bg-exyo-secondary animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <div className="h-12 bg-exyo-hover/50 rounded w-96 mb-4 animate-pulse" />
        <div className="h-4 bg-exyo-hover/50 rounded w-64 mb-2 animate-pulse" />
        <div className="h-4 bg-exyo-hover/50 rounded w-80 mb-4 animate-pulse" />
        <div className="h-16 bg-exyo-hover/50 rounded w-96 mb-6 animate-pulse" />
        <div className="flex gap-4">
          <div className="h-12 bg-exyo-hover/50 rounded w-32 animate-pulse" />
          <div className="h-12 bg-exyo-hover/50 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="min-h-screen">
      <div className="relative h-[70vh] bg-exyo-secondary animate-pulse" />
      <div className="px-4 md:px-12 py-8">
        <div className="max-w-2xl">
          <div className="h-12 bg-exyo-secondary rounded w-96 mb-4 animate-pulse" />
          <div className="flex gap-4 mb-4">
            <div className="h-6 bg-exyo-secondary rounded w-16 animate-pulse" />
            <div className="h-6 bg-exyo-secondary rounded w-16 animate-pulse" />
            <div className="h-6 bg-exyo-secondary rounded w-16 animate-pulse" />
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-8 bg-exyo-secondary rounded-full w-20 animate-pulse" />
            <div className="h-8 bg-exyo-secondary rounded-full w-20 animate-pulse" />
          </div>
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-exyo-secondary rounded w-full animate-pulse" />
            <div className="h-4 bg-exyo-secondary rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-exyo-secondary rounded w-4/6 animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-12 bg-exyo-secondary rounded w-32 animate-pulse" />
            <div className="h-12 bg-exyo-secondary rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="aspect-video bg-exyo-secondary rounded animate-pulse mb-2" />
          <div className="h-4 bg-exyo-secondary rounded w-3/4 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPlayer() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-exyo-red"></div>
    </div>
  );
}
