import {useEffect} from 'react'
import {ShadowOverlay} from '~/components/home/ShadowOverlay'
import {EmbossedLogo} from '~/components/webgl/EmbossedLogo'

export default function SlotPage() {
  useEffect(() => {
    document.body.classList.add('slot-active')
    return () => {
      document.body.classList.remove('slot-active')
    }
  }, [])

  return (
    <section className="slot-page">
      <ShadowOverlay />
      <EmbossedLogo className="slot-emboss" padding={0.15} />

      <a
        className="slot-newsletter"
        href="mailto:hello@bodista.com?subject=Newsletter"
      >
        newsletter
      </a>

      <ul className="slot-socials">
        <li>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            instagram
          </a>
        </li>
        <li>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            facebook
          </a>
        </li>
        <li>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
            tiktok
          </a>
        </li>
      </ul>
    </section>
  )
}
