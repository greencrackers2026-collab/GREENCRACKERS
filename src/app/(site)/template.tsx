/**
 * Re-mounts on every navigation, replaying a soft CSS entrance.
 * Pure CSS (not JS) so it runs before hydration and never delays LCP.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
