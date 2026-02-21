import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import styles from './featured-product.module.css';

export function FeaturedProduct({
  product,
}: {
  product: RecommendedProductFragment;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.imageCol}>
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="4/5"
              sizes="(min-width: 768px) 50vw, 100vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
        <div className={styles.infoCol}>
          <p className={styles.label}>Featured</p>
          <h2 className={styles.productName}>{product.title}</h2>
          <p className={styles.price}>
            <Money data={product.priceRange.minVariantPrice} />
          </p>
          <p className={styles.description}>
            Our signature full-body oil. A blend of cold-pressed jojoba,
            rosehip, and sweet almond oil — designed to absorb instantly while
            leaving skin impossibly soft. The scent is subtle: warm, botanical,
            grounding.
          </p>
          <Link
            to={`/products/${product.handle}`}
            className={styles.cta}
          >
            Add to Ritual
          </Link>
        </div>
      </div>
    </section>
  );
}
