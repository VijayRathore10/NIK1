# Implementation Plan: Instant Vehicle Page Navigation & Data Caching

Diagnose and resolve the 2–3 second delay when clicking vehicle cards so vehicle product pages open instantly with smooth, responsive transitions.

---

## 1. Problem & Root Cause Analysis

Based on our diagnosis of the codebase, clicking a vehicle card takes several seconds to open due to four compounded bottlenecks:

1. **Missing `loading.js` Skeleton in App Router**:
   Next.js App Router delays navigation until the server component finishes fetching and rendering if no `loading.js` exists. Without it, the browser sits on the current page for 2–3 seconds with zero visual feedback, making the site feel unresponsive.
2. **Forced Dynamic Rendering with Zero Caching**:
   `app/product/[slug]/page.js` is set to `dynamic = 'force-dynamic'` and `revalidate = 0`. This disables Next.js route caching and prevents prefetching when vehicle cards enter the viewport.
3. **Inefficient Double Firestore Lookup on Every Click**:
   In `lib/db.js`, `getDbProductBySlug(slug)` first queries Firestore by `doc(db, 'products', slug)`. Because vehicle documents are stored with IDs like `prod-1`, this direct ID lookup always misses, triggering a secondary full-collection scan `getDocs(collection(db, 'products'))` across the network on every single click.
4. **No In-Memory Cache or Slug Map**:
   The database layer does not cache fetched Firestore items or maintain a fast slug-to-product lookup map. Admin updates already occur through the API, but public reads suffer unneeded network round-trips.

---

## 2. Proposed Solution & Architecture

### A. Instant Visual Transition (`app/product/[slug]/loading.js`)
- Create a dedicated Next.js App Router `loading.js` skeleton for `/product/[slug]`.
- Displays an immediate matching layout (breadcrumb skeleton, vehicle gallery placeholder shimmer, title and spec table skeleton).
- **Impact**: Instant response upon click—the user experiences immediate navigation without feeling stuck.

### B. In-Memory Cache & Fast Slug Indexing in `lib/db.js`
- Implement a lightweight, TTL-based server cache (e.g. 60-second TTL) for `products`, `categories`, and `siteSettings`.
- Maintain a slug map (`slugMap[slug.toLowerCase()]`) so `getProductBySlug` resolves in `< 1ms` in memory without making redundant Firestore round-trips.
- Automatically invalidate/refresh the cache whenever an admin creates, edits, or deletes a product in `saveDbProduct` / `deleteDbProduct`.
- Avoid unnecessary `ensureFirestoreSeeded()` scans on read paths once migrated.

### C. Enable Route Prefetching & Incremental Revalidation (`app/product/[slug]/page.js`)
- Replace `revalidate = 0` and `dynamic = 'force-dynamic'` with Next.js ISR (`revalidate = 60`) or stale-while-revalidate.
- This allows Next.js `<Link>` components to prefetch the product route payload in the background as the user scrolls the catalog.
- When clicked, navigation is virtually instantaneous (served directly from client prefetch cache).

### D. Optimize ProductCard Link & Image Attributes (`components/ProductCard.js` & `components/ImageCarousel.js`)
- Explicitly set `prefetch={true}` on vehicle card `<Link>` elements.
- Add `priority` or optimized `sizes` for the primary gallery hero image on the product detail page to prevent photo render delay.

---

## 3. Step-by-Step Implementation Steps

### Step 1: Create `app/product/[slug]/loading.js`
- Build a tailored skeleton loader matching the 5-column layout of the vehicle details page (gallery shimmer, specifications grid skeleton, breadcrumb placeholder).

### Step 2: Update `lib/db.js` with In-Memory Caching & Slug Index
- Add cached snapshot storage with 60-second TTL and instant slug lookup.
- Hook cache eviction into `saveDbProduct` and `deleteDbProduct` so admin changes still reflect immediately.

### Step 3: Optimize Route Caching in `app/product/[slug]/page.js`
- Configure `revalidate = 60` (or `revalidate = 120`) to allow Next.js route segment caching and background prefetching.
- Keep `dynamicParams = true` to support new vehicles created in the admin portal.

### Step 4: Ensure Link Prefetching on Vehicle Cards
- Verify `components/ProductCard.js` and category sliders prefetch target product URLs smoothly.

---

## 4. Verification Plan

1. **Compilation & Syntax Verification**:
   - Run `compile_applet` and verify no TypeScript/Next.js build errors.
2. **Navigation Latency Check**:
   - Measure navigation time from the home page / catalog to `/product/[slug]`.
   - Verify that clicking any vehicle card immediately transitions and displays the skeleton loader or loads the page in under 100ms when prefetched.
3. **Data Integrity & Admin Sync Check**:
   - Verify that editing or adding a product in the admin dashboard immediately clears the cache and displays the updated data on the public product page.
