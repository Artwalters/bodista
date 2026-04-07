'use client'

import {Link} from 'react-router'
import {ShadowOverlay} from './ShadowOverlay'
import {EmbossedLogo} from '~/components/webgl/EmbossedLogo'

export function HeroHeader() {
  return (
    <section className="hero">
      <ShadowOverlay />
      <div className="hero-top">
        <EmbossedLogo
          className="hero-emboss"
          alignBottom
          bottomOffset={0.04}
          highlightStrength={0.25}
          shadowStrength={0.85}
        />
        <div className="hero-copy">
          <p className="hero-copy-text">
            At Bodista, we are dedicated to creating our products using 100%
            natural, high quality ingredients while respecting the environment
          </p>
          <div className="hero-copy-link">
            <hr />
            <Link to="/collections" className="hero-copy-link-inner">
              <span>shop all products</span>
              <svg className="hero-copy-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 19L21 12L14 5" stroke="currentColor" strokeMiterlimit="10" />
                <path d="M21 12H2" stroke="currentColor" strokeMiterlimit="10" />
              </svg>
            </Link>
            <hr />
          </div>
        </div>
      </div>
      <div className="hero-image">
        <img src="/images/hero1.png" alt="" />
      </div>
    </section>
  )
}
