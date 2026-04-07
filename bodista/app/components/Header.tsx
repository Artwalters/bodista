'use client'

import {Suspense, useEffect, useRef} from 'react'
import {Await, NavLink, useAsyncValue} from 'react-router'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen'
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated'
import {useAside} from '~/components/Aside'
import {useMenu} from '~/components/PageLayout'

interface HeaderProps {
  header: HeaderQuery
  cart: Promise<CartApiQueryFragment | null>
  isLoggedIn: Promise<boolean>
  publicStoreDomain: string
}

type Viewport = 'desktop' | 'mobile'

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header
  const {isMenuOpen} = useMenu()
  const locationsRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLSpanElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const menuOpenRef = useRef(isMenuOpen)

  // Build timeline once
  useEffect(() => {
    const locations = locationsRef.current
    const logo = logoRef.current
    if (!locations || !logo) return

    const masks = locations.querySelectorAll('.header-location-mask')
    const spans = Array.from(masks).map((m) => m.querySelector('span'))
    const marker = document.querySelector('.header-locations-marker')

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({paused: true})

      tl.to(spans, {
        yPercent: 110,
        duration: 0.4,
        stagger: {each: 0.05, from: 'end'},
        ease: 'expo.in',
      })

      if (marker) {
        tl.to(
          marker,
          {
            autoAlpha: 0,
            duration: 0.4,
            ease: 'expo.in',
          },
          '<',
        )
      }

      tlRef.current = tl

      // Trigger on scroll
      stRef.current = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top -1',
        onEnter: () => tl.play(),
        onLeaveBack: () => tl.reverse(),
      })
    })

    return () => ctx.revert()
  }, [])

  // Trigger on menu open/close
  useEffect(() => {
    menuOpenRef.current = isMenuOpen
    if (!tlRef.current || !stRef.current) return
    if (isMenuOpen) {
      stRef.current.disable()
      tlRef.current.pause()
      gsap.to(tlRef.current, {progress: 1, duration: 0.3, ease: 'expo.in'})
    } else {
      // Wait for menu close animation (1.6s) before re-enabling
      gsap.delayedCall(1.6, () => {
        if (!menuOpenRef.current) {
          stRef.current?.enable()
          if (window.scrollY <= 0) {
            tlRef.current?.reverse()
          }
        }
      })
    }
  }, [isMenuOpen])

  return (
    <div className="header-wrapper" data-menu-open={isMenuOpen || undefined}>
      <header className="header">
        <div className="header-left">
          <span ref={logoRef}>
            <NavLink prefetch="intent" to="/" className="header-logo-text">
              bodista
            </NavLink>
          </span>
        </div>
        <div className="header-center">
          <span className="header-locations-marker">§</span>
          <div className="header-locations" ref={locationsRef}>
            <div className="header-location-mask">
              <span>oils</span>
            </div>
            <div className="header-location-mask">
              <span>serums</span>
            </div>
            <div className="header-location-mask">
              <span>mist</span>
            </div>
            <div className="header-location-mask">
              <span>fragrances</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <NavLink to="/search" prefetch="intent" className="header-search">
            search
          </NavLink>
          <NavLink to="/account" prefetch="intent" className="header-search">
            profile
          </NavLink>
          <CartToggle cart={cart} />
          <MenuToggle />
        </div>
      </header>
    </div>
  )
}

function MenuToggle() {
  const {isMenuOpen, toggleMenu} = useMenu()
  return (
    <button
      className="header-menu-toggle reset"
      onClick={toggleMenu}
      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isMenuOpen}
    >
      {isMenuOpen ? 'close' : 'menu'}
    </button>
  )
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu']
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url']
  viewport: Viewport
  publicStoreDomain: HeaderProps['publicStoreDomain']
}) {
  const className = `header-menu-${viewport}`
  const {close} = useAside()

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        )
      })}
    </nav>
  )
}

function BagIcon() {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4V3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3V4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <rect
        x="0.5"
        y="4"
        width="15"
        height="13"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside()
  const {publish, shop, cart, prevCart} = useAnalytics()

  return (
    <a
      href="/cart"
      className="header-bag"
      onClick={(e) => {
        e.preventDefault()
        open('cart')
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload)
      }}
    >
      cart(<span className="header-bag-count">{count ?? 0}</span>)
    </a>
  )
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  )
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null
  const cart = useOptimisticCart(originalCart)
  return <CartBadge count={cart?.totalQuantity ?? 0} />
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
}
