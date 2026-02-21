import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {HeroHeader} from '~/components/home/HeroHeader';
import {MarqueeBanner} from '~/components/home/MarqueeBanner';
import {LiquidGold} from '~/components/home/LiquidGold';
import {BrandPhilosophy} from '~/components/home/BrandPhilosophy';
import {ProductHighlights} from '~/components/home/ProductHighlights';
import {RitualAdvocates} from '~/components/home/RitualAdvocates';
import {FeaturedProduct} from '~/components/home/FeaturedProduct';
import {TestimonialBanner} from '~/components/home/TestimonialBanner';
import {SocialGrid} from '~/components/home/SocialGrid';
import {BlogPreview} from '~/components/home/BlogPreview';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Bodista | Begin Your Ritual'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <HeroHeader collection={data.featuredCollection} />
      <MarqueeBanner />
      <LiquidGold />
      <BrandPhilosophy />
      <Suspense fallback={<div />}>
        <Await resolve={data.recommendedProducts}>
          {(response) => {
            const products = response?.products.nodes ?? [];
            const highlights = products.slice(0, 3);
            const featured = products[3] ?? products[0];
            return (
              <>
                <ProductHighlights products={highlights} />
                <RitualAdvocates />
                {featured && <FeaturedProduct product={featured} />}
              </>
            );
          }}
        </Await>
      </Suspense>
      <TestimonialBanner />
      <SocialGrid />
      <BlogPreview />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
