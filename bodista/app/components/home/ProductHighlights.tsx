import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';
import styles from './product-highlights.module.css';

export function ProductHighlights({
  products,
}: {
  products: RecommendedProductFragment[];
}) {
  if (!products.length) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Our Essentials</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.handle}`}
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              {product.featuredImage ? (
                <Image
                  data={product.featuredImage}
                  aspectRatio="3/4"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className={styles.image}
                />
              ) : (
                <div className={styles.imagePlaceholder} />
              )}
            </div>
            <h3 className={styles.productName}>{product.title}</h3>
            <p className={styles.price}>
              <Money data={product.priceRange.minVariantPrice} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
