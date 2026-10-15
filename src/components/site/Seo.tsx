import { useStore } from "@/lib/store";
import { absoluteUrl } from "@/lib/seo";

/**
 * Per-page title, description, canonical, Open Graph and Twitter tags.
 * React 19 hoists these elements into <head>; main.tsx removes the static defaults from index.html.
 */
export function Seo(opts: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
  /** Use the title as-is instead of appending " | Store name". */
  absolute?: boolean;
}) {
  const { settings } = useStore();
  const title = opts.absolute ? opts.title : `${opts.title} | ${settings.store_name}`;
  const image = absoluteUrl(opts.image ?? "/og-image.jpg");
  return (
    <>
      <title>{title}</title>
      {opts.description && <meta name="description" content={opts.description} />}
      {opts.keywords && <meta name="keywords" content={opts.keywords.join(", ")} />}
      {opts.path && <link rel="canonical" href={absoluteUrl(opts.path)} />}
      {opts.noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={settings.store_name} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={title} />
      {opts.description && <meta property="og:description" content={opts.description} />}
      {opts.path && <meta property="og:url" content={absoluteUrl(opts.path)} />}
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {opts.description && <meta name="twitter:description" content={opts.description} />}
      <meta name="twitter:image" content={image} />
    </>
  );
}
