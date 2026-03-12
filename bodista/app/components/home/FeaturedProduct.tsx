import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {RecommendedProductFragment} from 'storefrontapi.generated';

export function FeaturedProduct({
  product,
}: {
  product: RecommendedProductFragment;
}) {
  return (
    <section className="featured">
      <div className="featured-grid">
        <div>
          {product.featuredImage ? (
            <Image
              data={product.featuredImage}
              aspectRatio="4/5"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="featured-image"
            />
          ) : (
            <div className="featured-image-placeholder" />
          )}
        </div>
        <div>
          <p className="featured-label">Featured</p>
          <h2 className="featured-product-name">{product.title}</h2>
          <p className="featured-price">
            <Money data={product.priceRange.minVariantPrice} />
          </p>
          <p className="featured-description">
            Our signature full-body oil. A blend of cold-pressed jojoba,
            rosehip, and sweet almond oil — designed to absorb instantly while
            leaving skin impossibly soft. The scent is subtle: warm, botanical,
            grounding.
          </p>
          <Link
            to={`/products/${product.handle}`}
            className="featured-cta"
          >
            Add to Ritual
          </Link>
        </div>
      </div>
    </section>
  );
}
