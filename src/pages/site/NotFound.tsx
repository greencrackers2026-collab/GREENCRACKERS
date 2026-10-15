import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <title>Page not found</title>
      <meta name="robots" content="noindex" />
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <p className="text-6xl" aria-hidden="true">
          🎇
        </p>
        <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-white/70">This cracker fizzled out. Let&apos;s get you back to the sale.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link to="/products" className="btn btn-ghost">
            Shop Crackers
          </Link>
        </div>
      </div>
    </div>
  );
}
