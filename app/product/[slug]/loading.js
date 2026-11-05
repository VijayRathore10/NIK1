export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 pt-28 pb-16 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-2 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-2 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        <div className="h-3 w-32 bg-gray-300 dark:bg-zinc-700 rounded"></div>
      </div>

      <div className="grid lg:grid-cols-5 gap-10">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Image Carousel Skeleton */}
          <div className="w-full aspect-[4/3] bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>

          {/* Thumbnails row */}
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-20 h-16 bg-gray-200 dark:bg-zinc-800 rounded-lg flex-shrink-0"
              ></div>
            ))}
          </div>

          {/* Description Overview Skeleton */}
          <div className="mt-8 pt-6 border-t border-line/80 space-y-3">
            <div className="h-4 w-36 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-5/6 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-4/6 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>

          {/* Inquiry Form Skeleton */}
          <div className="mt-8 pt-6 border-t border-line/80 space-y-4">
            <div className="h-4 w-48 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-24 w-full bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
            <div className="h-11 w-44 bg-amber/30 rounded-lg"></div>
          </div>
        </div>

        {/* Right Column: Title, Highlights & Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Name */}
          <div className="space-y-2">
            <div className="h-8 w-4/5 bg-gray-300 dark:bg-zinc-700 rounded-lg"></div>
            <div className="h-5 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>

          {/* Highlight Tags */}
          <div className="p-4 bg-gray-100 dark:bg-zinc-900 border border-line rounded-lg flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-6 w-20 bg-gray-200 dark:bg-zinc-800 rounded"
              ></div>
            ))}
          </div>

          {/* Specifications Table Skeleton */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-32 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            <div className="border-t border-line divide-y divide-line">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="py-2.5 flex justify-between">
                  <div className="h-3.5 w-28 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3.5 w-36 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
