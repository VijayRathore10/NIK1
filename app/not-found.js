import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-7xl px-5 md:px-8 py-32 text-center">
      <p className="mono-label text-xs uppercase text-amber-dark mb-3">404</p>
      <h1 className="font-display text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-graphite mb-8">The page you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Link href="/" className="mono-label text-xs uppercase bg-amber text-steel px-5 py-3 hover:bg-amber-dark transition-colors">
        Back to Home
      </Link>
    </section>
  );
}
