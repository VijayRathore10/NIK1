export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-3 w-12 bg-gray-200 rounded" />
        <div className="h-3 w-2 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-2 bg-gray-200 rounded" />
        <div className="h-3 w-40 bg-gray-300 rounded" />
      </div>

      {/* Full-Width Carousel Skeleton */}
      <div className="w-full mb-8 sm:mb-10">
        <div className="w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] max-h-[720px] bg-gray-200 rounded-2xl" />
        <div className="flex gap-3 py-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-14 sm:w-28 sm:h-20 bg-gray-200 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Header Skeleton */}
      <div className="mb-8 pb-6 border-b border-line/80 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-44 bg-gray-200 rounded" />
          <div className="h-10 w-2/3 max-w-md bg-gray-300 rounded-lg" />
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="h-10 w-44 bg-gray-200 rounded" />
      </div>

      {/* Overview Card Skeleton */}
      <div className="w-full mb-10 sm:mb-12 bg-white p-6 sm:p-8 rounded-2xl border border-line/80 space-y-3">
        <div className="h-7 w-64 bg-gray-300 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
      </div>

      {/* 12-Column (7 / 5) Specs & Inquiry Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-line space-y-4">
          <div className="h-6 w-52 bg-gray-300 rounded" />
          <div className="divide-y divide-line">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="py-3 flex justify-between gap-4">
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border-2 border-line/90 p-6 sm:p-7 space-y-4">
          <div className="h-6 w-48 bg-gray-300 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded-lg" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="h-24 w-full bg-gray-200 rounded" />
          <div className="h-11 w-full bg-amber/30 rounded" />
        </div>
      </div>
    </div>
  );
}
