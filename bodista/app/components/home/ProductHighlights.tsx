import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';

export function ProductHighlights({
  products,
}: {
  products: RecommendedProductFragment[];
}) {
  if (!products.length) return null;

  return (
    <section className="highlights">
      <h2 className="highlights-heading">Our Essentials</h2>
      <div className="highlights-grid">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.handle}`}
            className="highlights-card"
          >
            <div className="highlights-image-wrapper">
              {product.featuredImage ? (
                <Image
                  data={product.featuredImage}
                  aspectRatio="3/4"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="highlights-image"
                />
              ) : (
                <div className="highlights-image-placeholder" />
              )}
            </div>
            <h3 className="highlights-product-name">{product.title}</h3>
            <p className="highlights-price">
              <Money data={product.priceRange.minVariantPrice} />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
