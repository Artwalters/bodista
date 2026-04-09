'use client'

import {NavLink} from 'react-router'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-column site-footer-intro">
          <span className="site-footer-index">1.</span>
          <p className="site-footer-intro-text">
            Bodista&apos;s philosophy stems from the power botanical
            ingredients — celebrating the union between nature, ancient
            rituals, and refined skincare craftsmanship.
          </p>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-heading">Information</span>
          <nav className="site-footer-links">
            <NavLink to="/pages/botanical" prefetch="intent">botanical</NavLink>
            <NavLink to="/pages/face" prefetch="intent">Face</NavLink>
            <NavLink to="/pages/routines" prefetch="intent">Routines</NavLink>
            <NavLink to="/pages/learn-more" prefetch="intent">Learn More</NavLink>
          </nav>
          <div className="routine-links site-footer-link-wrap">
            <hr />
            <a href="/blogs/research" className="routine-link-inner">
              <span>research papers</span>
              <svg className="routine-link-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 19L21 12L14 5" stroke="currentColor" strokeMiterlimit="10" />
                <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" />
              </svg>
            </a>
            <hr />
          </div>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-heading">press and social</span>
          <nav className="site-footer-links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">Tiktok</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">Youtube</a>
          </nav>
          <span className="site-footer-bottom-link">&copy; 2026</span>
        </div>

        <div className="site-footer-column">
          <span className="site-footer-heading">Shop</span>
          <nav className="site-footer-links">
            <NavLink to="/collections/body" prefetch="intent">Body</NavLink>
            <NavLink to="/collections/face" prefetch="intent">Face</NavLink>
            <NavLink to="/collections/routines" prefetch="intent">Routines</NavLink>
            <NavLink to="/collections/cloths" prefetch="intent">Cloths</NavLink>
            <NavLink to="/collections/scalp" prefetch="intent">Scalp</NavLink>
          </nav>
          <div className="routine-links site-footer-link-wrap">
            <hr />
            <a href="/collections" className="routine-link-inner">
              <span>shop all</span>
              <svg className="routine-link-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 19L21 12L14 5" stroke="currentColor" strokeMiterlimit="10" />
                <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" />
              </svg>
            </a>
            <hr />
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span className="site-footer-copyright">Copyright © 2026 Bodista</span>
        <span className="site-footer-wordmark">bodista</span>
      </div>
    </footer>
  )
}
