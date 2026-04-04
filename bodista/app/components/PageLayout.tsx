'use client'

import {Await, Link} from 'react-router'
import {Suspense, useId, useEffect, useRef, useState, createContext, useContext, useCallback} from 'react'
import {gsap} from 'gsap'
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated'
import {Aside} from '~/components/Aside'
import {Footer} from '~/components/Footer'
import {Header, HeaderMenu} from '~/components/Header'
import {CartMain} from '~/components/CartMain'
import {MenuPanel} from '~/components/MenuPanel'
import {getLenisInstance} from '~/lib/lenis'
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive'
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive'

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>
  footer: Promise<FooterQuery | null>
  header: HeaderQuery
  isLoggedIn: Promise<boolean>
  publicStoreDomain: string
  children?: React.ReactNode
}

const MenuContext = createContext<{
  isMenuOpen: boolean
  toggleMenu: () => void
}>({isMenuOpen: false, toggleMenu: () => {}})

export const useMenu = () => useContext(MenuContext)

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const mainContentInnerRef = useRef<HTMLDivElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!mainContentRef.current || !mainContentInnerRef.current || !menuPanelRef.current) return
    const outer = mainContentRef.current
    const inner = mainContentInnerRef.current
    const lenis = getLenisInstance()
    const menuHeight = menuPanelRef.current.offsetHeight

    if (isMenuOpen) {
      // Capture scroll and stop Lenis
      scrollYRef.current = window.scrollY || 0
      if (lenis) lenis.stop()

      // Keep body height so it doesn't collapse when we go fixed
      document.body.style.height = document.body.scrollHeight + 'px'

      // Get the header padding before removing it
      const headerPadding = parseFloat(getComputedStyle(outer).paddingTop) || 0

      // Freeze page: outer = fixed viewport, inner = offset by scroll
      outer.style.position = 'fixed'
      outer.style.top = '0'
      outer.style.left = '0'
      outer.style.right = '0'
      outer.style.width = '100%'
      outer.style.height = '100vh'
      outer.style.overflow = 'clip'
      outer.style.paddingTop = '0'
      inner.style.position = 'absolute'
      inner.style.top = -(scrollYRef.current - headerPadding) + 'px'
      inner.style.left = '0'
      inner.style.width = '100%'

      // Reset scroll (now safe, element is fixed)
      window.scrollTo(0, 0)
      document.body.style.height = ''

      // Slide the whole frozen page down
      gsap.to(outer, {
        y: menuHeight,
        duration: 0.6,
        ease: 'power3.inOut',
      })
    } else {
      // Slide back up
      gsap.to(outer, {
        y: 0,
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => {
          // Clear all inline styles
          gsap.set(outer, {clearProps: 'all'})
          gsap.set(inner, {clearProps: 'all'})

          // Restore scroll position
          window.scrollTo(0, scrollYRef.current)

          if (lenis) {
            lenis.scrollTo(scrollYRef.current, {immediate: true})
            lenis.start()
            lenis.resize()
          }
        },
      })
    }
  }, [isMenuOpen])

  return (
    <MenuContext.Provider value={{isMenuOpen, toggleMenu}}>
      <Aside.Provider>
        <CartAside cart={cart} />
        <SearchAside />
        <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />

        <div className="site-header-fixed">
          <div className="announcement-bar">
            FREE FROM SOAP &amp; ADDITIVES |{' '}
            <a href="/pages/about">DISCOVER BODISTA</a>
          </div>
          {header && (
            <Header
              header={header}
              cart={cart}
              isLoggedIn={isLoggedIn}
              publicStoreDomain={publicStoreDomain}
            />
          )}
        </div>

        <div className="menu-panel-wrapper" ref={menuPanelRef}>
          <MenuPanel />
        </div>

        <div className="main-content" ref={mainContentRef}>
          <div ref={mainContentInnerRef}>
            <main>{children}</main>
            <Footer
              footer={footer}
              header={header}
              publicStoreDomain={publicStoreDomain}
            />
          </div>
        </div>
      </Aside.Provider>
    </MenuContext.Provider>
  )
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />
          }}
        </Await>
      </Suspense>
    </Aside>
  )
}

function SearchAside() {
  const queriesDatalistId = useId()
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            )
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  )
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header']
  publicStoreDomain: PageLayoutProps['publicStoreDomain']
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  )
}
