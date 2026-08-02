export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[240px] md:w-[280px] lg:w-[320px]">
      <div className="aspect-video shimmer rounded-2xl" />
      <div className="mt-2.5 px-1 space-y-1">
        <div className="h-3.5 shimmer rounded-lg w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="mb-14 md:mb-16">
      <div className="flex items-center justify-between px-5 md:px-10 lg:px-14 mb-4">
        <div className="h-6 shimmer rounded-lg w-40" />
        <div className="h-4 shimmer rounded-lg w-16" />
      </div>
      <div className="flex gap-4 md:gap-5 px-5 md:px-10 lg:px-12 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[92vh] min-h-[640px] max-h-[960px] w-full shimmer">
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-[#0B0B0B]/50 to-transparent" />
      <div className="absolute bottom-[10%] left-0 right-0 px-5 md:px-10 lg:px-14">
        <div className="max-w-3xl">
          <div className="h-4 shimmer rounded-lg w-24 mb-4" />
          <div className="h-[5rem] md:h-[6rem] lg:h-[7rem] shimmer rounded-2xl w-[60%] mb-5" />
          <div className="flex gap-3 mb-5">
            <div className="h-5 shimmer rounded-lg w-14" />
            <div className="h-5 shimmer rounded-lg w-10" />
            <div className="h-5 shimmer rounded-lg w-16" />
          </div>
          <div className="space-y-2 mb-8">
            <div className="h-4 shimmer rounded-lg w-full" />
            <div className="h-4 shimmer rounded-lg w-5/6" />
            <div className="h-4 shimmer rounded-lg w-4/6" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 shimmer rounded-2xl w-32" />
            <div className="h-12 shimmer rounded-2xl w-32" />
            <div className="h-12 shimmer rounded-2xl w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-exyo-dark">
      <div className="relative h-[85vh] min-h-[500px] shimmer" />
      <div className="px-5 md:px-10 lg:px-14 py-10">
        <div className="max-w-3xl">
          <div className="flex gap-2 mb-4">
            <div className="h-3.5 shimmer rounded-lg w-14" />
            <div className="h-3.5 shimmer rounded-lg w-16" />
          </div>
          <div className="h-[4rem] md:h-[5rem] lg:h-[6rem] shimmer rounded-2xl w-[60%] mb-5" />
          <div className="flex gap-3 mb-6">
            <div className="h-5 shimmer rounded-lg w-14" />
            <div className="h-5 shimmer rounded-lg w-10" />
            <div className="h-5 shimmer rounded-lg w-16" />
          </div>
          <div className="space-y-2 mb-8">
            <div className="h-4 shimmer rounded-lg w-full" />
            <div className="h-4 shimmer rounded-lg w-5/6" />
            <div className="h-4 shimmer rounded-lg w-4/6" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 shimmer rounded-2xl w-32" />
            <div className="h-12 shimmer rounded-2xl w-32" />
            <div className="h-12 shimmer rounded-2xl w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="aspect-video shimmer rounded-2xl mb-2" />
          <div className="h-3.5 shimmer rounded-lg w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPlayer() {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-exyo-red" />
    </div>
  );
}
