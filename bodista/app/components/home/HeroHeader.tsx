import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';

export function HeroHeader({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  return (
    <section className="hero">
      <div className="hero-backdrop">
        {collection?.image && (
          <Image
            data={collection.image}
            sizes="100vw"
            className="hero-bg-image"
          />
        )}
        <div className="hero-content">
          <h1 className="hero-headline">Begin Your Ritual</h1>
          <p className="hero-subtext">
            Discover the art of oil-based body care — crafted for those who
            believe self-care is a daily ceremony.
          </p>
          {collection && (
            <Link
              to={`/collections/${collection.handle}`}
              className="hero-cta"
            >
              Shop {collection.title}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
