
export const SkeletonLoader = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 ${className}`} />
);

export const CardSkeleton = () => (
  <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md">
    <SkeletonLoader className="h-6 w-1/3" />
    <SkeletonLoader className="h-10 w-1/2" />
    <SkeletonLoader className="h-4 w-2/3" />
  </div>
);

export const GaugeSkeleton = () => (
  <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md">
    <SkeletonLoader className="h-6 w-1/2" />
    <SkeletonLoader className="h-48 w-48 rounded-full" />
    <SkeletonLoader className="h-4 w-3/4" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="flex flex-col gap-6 p-6 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md h-96">
    <SkeletonLoader className="h-6 w-1/4" />
    <div className="flex-1 flex items-end gap-2">
      {[...Array(12)].map((_, i) => (
        <SkeletonLoader key={i} className={`w-full ${['h-1/4','h-1/2','h-1/3','h-3/4','h-2/3','h-full','h-1/2','h-1/4','h-2/5','h-3/5','h-4/5','h-full'][i]}`} />
      ))}
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-md">
    <SkeletonLoader className="h-6 w-1/4 mb-4" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <SkeletonLoader className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonLoader className="h-4 w-1/3" />
          <SkeletonLoader className="h-3 w-1/4" />
        </div>
        <SkeletonLoader className="h-5 w-16" />
      </div>
    ))}
  </div>
);
