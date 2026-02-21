import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';
import styles from './hero-header.module.css';

export function HeroHeader({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.videoPlaceholder}>
        {collection?.image && (
          <Image
            data={collection.image}
            sizes="100vw"
            className={styles.bgImage}
          />
        )}
        <div className={styles.content}>
          <h1 className={styles.headline}>Begin Your Ritual</h1>
          <p className={styles.subtext}>
            Discover the art of oil-based body care — crafted for those who
            believe self-care is a daily ceremony.
          </p>
          {collection && (
            <Link
              to={`/collections/${collection.handle}`}
              className={styles.cta}
            >
              Shop {collection.title}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
