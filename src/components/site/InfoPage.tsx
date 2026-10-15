import { Breadcrumbs } from "./Breadcrumbs";
import { Seo } from "./Seo";

export function InfoPage({
  title,
  path,
  intro,
  seoTitle,
  description,
  keywords,
  children,
}: {
  title: string;
  path: string;
  intro?: string;
  seoTitle?: string;
  description: string;
  keywords?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Seo title={seoTitle ?? title} description={description} path={path} keywords={keywords} />
      <Breadcrumbs items={[{ name: title, href: path }]} />
      <h1 className="mt-3 font-display text-3xl text-gradient sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-white/75">{intro}</p>}
      <div className="glass prose-festive mt-6 rounded-3xl p-6 sm:p-8">{children}</div>
    </div>
  );
}
