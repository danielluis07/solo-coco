import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { bowlbyOne, figtree } from "@/fonts";
import { seo } from "@/content/page";

// NODE_ENV is also "production" for preview builds, so it cannot decide indexing.
const isProduction = (process.env.VERCEL_ENV || process.env.DEPLOYMENT_ENV) === "production";
const productionURL = process.env.PRODUCTION_URL ? new URL(process.env.PRODUCTION_URL) : undefined;
const sharingImage = productionURL
  ? [
      {
        url: new URL(seo.image, productionURL),
        width: seo.imageWidth,
        height: seo.imageHeight,
        alt: seo.imageAlt,
      },
    ]
  : [];

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  robots: { index: isProduction, follow: true },
  ...(productionURL && {
    metadataBase: productionURL,
    alternates: { canonical: productionURL },
  }),
  openGraph: {
    title: seo.title,
    description: seo.description,
    siteName: seo.siteName,
    locale: seo.locale,
    type: seo.type,
    ...(productionURL && { url: productionURL }),
    images: sharingImage,
  },
  twitter: {
    card: seo.card,
    title: seo.title,
    description: seo.description,
    images: sharingImage,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bowlbyOne.variable} ${figtree.variable} h-full antialiased`}>
      <head>
        {/* Keep URLs relative until the real production origin is configured.
            Next's image resolver otherwise supplies a deployment/localhost URL. */}
        {!productionURL && (
          <>
            <meta property="og:image" content={seo.image} />
            <meta property="og:image:width" content={String(seo.imageWidth)} />
            <meta property="og:image:height" content={String(seo.imageHeight)} />
            <meta property="og:image:alt" content={seo.imageAlt} />
            <meta name="twitter:image" content={seo.image} />
            <meta name="twitter:image:alt" content={seo.imageAlt} />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
