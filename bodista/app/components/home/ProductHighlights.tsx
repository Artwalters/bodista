import {useEffect, useRef} from 'react'
import {Link} from 'react-router'
import {Image} from '@shopify/hydrogen'
import {AddToCartButton} from '~/components/AddToCartButton'
import {useAside} from '~/components/Aside'

export function ProductHighlights({
  products,
}: {
  products: any[]
}) {
  const {open} = useAside()
  const headerRef = useRef<HTMLDivElement>(null)
  const titleLeftRef = useRef<HTMLHeadingElement>(null)
  const titleRightRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!headerRef.current || !titleLeftRef.current || !titleRightRef.current)
      return

    let ctx: any
    let scrollTrigger: any

    const init = async () => {
      const gsap = (await import('gsap')).default
      const {ScrollTrigger} = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        const tween = gsap.fromTo(
          [titleLeftRef.current, titleRightRef.current],
          {x: (i) => (i === 0 ? '0.5em' : '-0.5em')},
          {
            x: '0em',
            ease: 'none',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top bottom',
              end: 'bottom 60%',
              scrub: true,
            },
          },
        )
        scrollTrigger = tween.scrollTrigger
      })
    }

    init()

    return () => {
      scrollTrigger?.kill()
      ctx?.revert()
    }
  }, [])

  if (!products.length) return null

  return (
    <section className="products-section">
      <div className="products-header" ref={headerRef}>
        <h2 className="products-title-left" ref={titleLeftRef}>
          All
        </h2>
        <h2 className="products-title-right" ref={titleRightRef}>
          Products
        </h2>
      </div>
      <hr className="products-divider" />
      <div className="products-toolbar">
        <span className="products-count">
          all products (<span className="header-bag-count">{products.length}</span>)
        </span>
        <div className="products-filters">
          <span>oils</span>
          <span>serums</span>
          <span>bodymist</span>
          <span>cloths</span>
          <span className="products-filter-btn">
            <svg className="products-filter-icon" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.45703 0C6.73317 1.14e-08 6.95703 0.223858 6.95703 0.5V5.70117H12.1602C12.4363 5.70117 12.6602 5.92503 12.6602 6.20117C12.6602 6.47731 12.4363 6.70117 12.1602 6.70117H6.95703V12.1602C6.95703 12.4363 6.73317 12.6602 6.45703 12.6602C6.18089 12.6602 5.95703 12.4363 5.95703 12.1602V6.70117H0.5C0.223858 6.70117 0 6.47731 0 6.20117C0 5.92503 0.223858 5.70117 0.5 5.70117H5.95703V0.5C5.95703 0.223858 6.18089 -1.14e-08 6.45703 0Z" fill="currentColor" />
            </svg>
            Filters
          </span>
        </div>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const firstVariant = product.variants?.nodes?.[0]
          const variantTitles = product.variants?.nodes
            ?.map((v: any) => v.title)
            .filter((t: string) => t !== 'Default Title')
            .join('/')

          return (
            <div key={product.id} className="product-card">
              <span className="product-card-name">{product.productType || product.title}</span>
              <Link
                to={`/products/${product.handle}`}
                className="product-card-image-link"
              >
                {product.featuredImage ? (
                  <Image
                    data={product.featuredImage}
                    aspectRatio="3/4"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="product-card-image"
                  />
                ) : (
                  <div className="product-card-image-placeholder" />
                )}
              </Link>
              <div className="product-card-info">
                <div className="product-card-info-text">
                  <p className="product-card-description">
                    {product.description}
                  </p>
                </div>
                {firstVariant && (
                  <AddToCartButton
                    disabled={!firstVariant.availableForSale}
                    onClick={() => open('cart')}
                    lines={[
                      {
                        merchandiseId: firstVariant.id,
                        quantity: 1,
                      },
                    ]}
                  >
                    <svg
                      className="product-card-add-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 5V19" stroke="currentColor" strokeWidth="1" />
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </AddToCartButton>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
