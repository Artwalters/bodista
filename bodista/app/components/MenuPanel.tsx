'use client'

import {NavLink} from 'react-router'

export function MenuPanel() {
  return (
    <div className="menu-panel">
      <div className="menu-panel-inner">
        <div className="menu-panel-column">
          <span className="menu-panel-heading">Shop</span>
          <nav className="menu-panel-links">
            <NavLink to="/collections/body" prefetch="intent">Body</NavLink>
            <NavLink to="/collections/face" prefetch="intent">Face</NavLink>
            <NavLink to="/collections/routines" prefetch="intent">Routines</NavLink>
            <NavLink to="/collections/cloths" prefetch="intent">Cloths</NavLink>
            <NavLink to="/collections/scalp" prefetch="intent">Scalp</NavLink>
          </nav>
          <a href="/collections" className="menu-panel-bottom-link">
            shop all <span className="menu-panel-arrow">&#8599;</span>
          </a>
        </div>

        <div className="menu-panel-column">
          <span className="menu-panel-heading">Information</span>
          <nav className="menu-panel-links">
            <NavLink to="/pages/botanical" prefetch="intent">botanical</NavLink>
            <NavLink to="/pages/face" prefetch="intent">Face</NavLink>
            <NavLink to="/pages/routines" prefetch="intent">Routines</NavLink>
            <NavLink to="/pages/learn-more" prefetch="intent">Learn More</NavLink>
          </nav>
          <a href="/blogs/research" className="menu-panel-bottom-link">
            research papers <span className="menu-panel-arrow">&#8599;</span>
          </a>
        </div>

        <div className="menu-panel-column">
          <span className="menu-panel-heading">press and social</span>
          <nav className="menu-panel-links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">Tiktok</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">Youtube</a>
          </nav>
          <span className="menu-panel-bottom-link">&copy; 2026</span>
        </div>

        <div className="menu-panel-column menu-panel-featured">
          <div className="menu-panel-featured-header">
            <span className="menu-panel-heading">Intuition</span>
            <span className="menu-panel-social-handle">@casabodista</span>
          </div>
          <div className="menu-panel-featured-content">
            <h3 className="menu-panel-featured-title">
              HOW DO WE STAY HUMAN <em>in</em> AN AI GENERATED <em>world?</em>
            </h3>
            <div className="menu-panel-featured-image">
              <img src="/assets/logos/bodista_logo.svg" alt="" />
            </div>
          </div>
          <div className="menu-panel-featured-footer">
            <span>10 min read</span>
            <span className="menu-panel-featured-arrow">&rarr;</span>
          </div>
        </div>
      </div>
    </div>
  )
}
