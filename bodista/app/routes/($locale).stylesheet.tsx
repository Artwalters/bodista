import type {Route} from './+types/stylesheet';
import styles from '~/styles/stylesheet.module.css';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Stylesheet'}];
};

export default function Stylesheet() {
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1>Stylesheet</h1>
        <p>
          Overzicht van alle typografie, kleuren, spacing en componenten die in
          deze website worden gebruikt.
        </p>
      </div>

      {/* Scaling System */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Scaling System</h2>
        <p style={{marginBottom: '1.5em'}}>
          Fluid scaling op basis van het Osmo scaling system. Alle waarden
          gebruiken <code>em</code> units die meeschalen met de viewport.
        </p>
        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Desktop design</div>
            <div className={styles.scaleItemValue}>1440px</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Tablet design</div>
            <div className={styles.scaleItemValue}>834px</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Mobile Landscape</div>
            <div className={styles.scaleItemValue}>550px</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Mobile Portrait</div>
            <div className={styles.scaleItemValue}>390px</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Base unit</div>
            <div className={styles.scaleItemValue}>16px (1em)</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Font size</div>
            <div className={styles.scaleItemValue}>var(--size-font)</div>
          </div>
        </div>
      </section>

      {/* Colors */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Kleuren</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorSwatch}>
            <div
              className={styles.colorSwatchBlock}
              style={{background: 'var(--color-dark)'}}
            />
            <div className={styles.colorSwatchInfo}>
              <div className={styles.colorSwatchName}>Dark</div>
              <div className={styles.colorSwatchValue}>--color-dark / #000</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div
              className={styles.colorSwatchBlock}
              style={{background: 'var(--color-light)', border: '1px solid #e5e5e5'}}
            />
            <div className={styles.colorSwatchInfo}>
              <div className={styles.colorSwatchName}>Light</div>
              <div className={styles.colorSwatchValue}>--color-light / #fff</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div
              className={styles.colorSwatchBlock}
              style={{background: '#ddd'}}
            />
            <div className={styles.colorSwatchInfo}>
              <div className={styles.colorSwatchName}>Code bg</div>
              <div className={styles.colorSwatchValue}>#ddd</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div
              className={styles.colorSwatchBlock}
              style={{background: '#e5e5e5'}}
            />
            <div className={styles.colorSwatchInfo}>
              <div className={styles.colorSwatchName}>Border</div>
              <div className={styles.colorSwatchValue}>#e5e5e5</div>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div
              className={styles.colorSwatchBlock}
              style={{background: '#d1d5db'}}
            />
            <div className={styles.colorSwatchInfo}>
              <div className={styles.colorSwatchName}>Input border</div>
              <div className={styles.colorSwatchValue}>#d1d5db</div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Typografie</h2>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>Font Family</span>
          <p>
            system-ui, -apple-system, BlinkMacSystemFont, &apos;Segoe UI&apos;,
            Roboto, Oxygen, Ubuntu, Cantarell, &apos;Open Sans&apos;,
            &apos;Helvetica Neue&apos;, sans-serif
          </p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>h1 — 1.6em / 700</span>
          <h1 style={{marginTop: 0, marginBottom: 0}}>
            The quick brown fox jumps over the lazy dog
          </h1>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>h2 — 1.2em / 700</span>
          <h2 style={{marginBottom: 0}}>
            The quick brown fox jumps over the lazy dog
          </h2>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>h4</span>
          <h4>The quick brown fox jumps over the lazy dog</h4>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>h5</span>
          <h5>The quick brown fox jumps over the lazy dog</h5>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>p — 1em / line-height 1.4</span>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>a — link</span>
          <p>
            <a href="#typography">Dit is een link met hover underline</a>
          </p>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>code</span>
          <p>
            Gebruik <code>var(--size-font)</code> voor fluid scaling.
          </p>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>pre</span>
          <pre>{`:root {
  --size-unit: 16;
  --size-container-ideal: 1440;
}`}</pre>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>hr</span>
          <hr />
        </div>
      </section>

      {/* Spacing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing</h2>
        <div className={styles.scaleGrid}>
          {[
            {label: '0.125em', value: '2px'},
            {label: '0.25em', value: '4px'},
            {label: '0.5em', value: '8px'},
            {label: '0.75em', value: '12px'},
            {label: '1em', value: '16px'},
            {label: '1.25em', value: '20px'},
            {label: '1.5em', value: '24px'},
            {label: '2em', value: '32px'},
            {label: '3em', value: '48px'},
            {label: '4em', value: '64px'},
            {label: '6em', value: '96px'},
          ].map((item) => (
            <div key={item.label} className={styles.scaleItem}>
              <div className={styles.scaleItemLabel}>{item.value} equivalent</div>
              <div className={styles.scaleItemValue}>{item.label}</div>
              <div
                style={{
                  width: item.label,
                  height: '0.5em',
                  background: 'var(--color-dark)',
                  borderRadius: '0.125em',
                  marginTop: '0.5em',
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CSS Custom Properties */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>CSS Custom Properties</h2>
        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>--aside-width</div>
            <div className={styles.scaleItemValue}>25em</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>--header-height</div>
            <div className={styles.scaleItemValue}>4em</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>--grid-item-width</div>
            <div className={styles.scaleItemValue}>22.1875em</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>--cart-aside-summary-height</div>
            <div className={styles.scaleItemValue}>15.625em</div>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>
              --cart-aside-summary-height-with-discount
            </div>
            <div className={styles.scaleItemValue}>18.75em</div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        <div className={styles.buttonRow}>
          <button className={styles.exampleButton} type="button">
            Primary Button
          </button>
          <button className={styles.exampleButtonOutline} type="button">
            Outline Button
          </button>
          <button className="reset" type="button">
            Reset Button
          </button>
        </div>
      </section>

      {/* Forms */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Formulieren</h2>
        <div className={styles.row}>
          <div className={styles.col}>
            <form className={styles.formDemo} onSubmit={(e) => e.preventDefault()}>
              <fieldset>
                <legend>Account gegevens</legend>
                <label htmlFor="demo-name">Naam</label>
                <input id="demo-name" type="text" placeholder="Uw naam" />
                <label htmlFor="demo-email">E-mail</label>
                <input
                  id="demo-email"
                  type="email"
                  placeholder="uw@email.nl"
                />
                <label htmlFor="demo-password">Wachtwoord</label>
                <input
                  id="demo-password"
                  type="password"
                  placeholder="Wachtwoord"
                />
              </fieldset>
            </form>
          </div>
          <div className={styles.col}>
            <div className={styles.specimen}>
              <span className={styles.specimenLabel}>Input</span>
              <p>border-radius: 0.25em, border: 1px solid #000, padding: 0.5em</p>
            </div>
            <div className={styles.specimen}>
              <span className={styles.specimenLabel}>Fieldset</span>
              <p>flex column, padding: 1em, margin-bottom: 0.5em</p>
            </div>
            <div className={styles.specimen}>
              <span className={styles.specimenLabel}>Legend</span>
              <p>font-weight: 600, margin-bottom: 0.5em</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lists */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Lijsten</h2>
        <div className={styles.row}>
          <div className={styles.col}>
            <span className={styles.specimenLabel}>ul (geen bullets)</span>
            <ul>
              <li>Eerste item</li>
              <li>Tweede item</li>
              <li>Derde item</li>
              <li>Vierde item</li>
            </ul>
          </div>
          <div className={styles.col}>
            <span className={styles.specimenLabel}>dl</span>
            <dl>
              <dt>
                <strong>Term 1</strong>
              </dt>
              <dd>Beschrijving van het eerste item</dd>
              <dt>
                <strong>Term 2</strong>
              </dt>
              <dd>Beschrijving van het tweede item</dd>
            </dl>
          </div>
        </div>
      </section>

      {/* Grids */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Grid Layouts</h2>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>
            2 kolommen — recommended-products-grid (mobile)
          </span>
          <div className={`${styles.gridDemo} ${styles.gridDemo2col}`}>
            {Array.from({length: 4}).map((_, i) => (
              <div key={i} className={styles.gridDemoItem}>
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>
            4 kolommen — recommended-products-grid (desktop)
          </span>
          <div className={`${styles.gridDemo} ${styles.gridDemo4col}`}>
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className={styles.gridDemoItem}>
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.specimen}>
          <span className={styles.specimenLabel}>
            3 kolommen — collections-grid / products-grid
          </span>
          <div className={`${styles.gridDemo} ${styles.gridDemo3col}`}>
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className={styles.gridDemoItem}>
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Layout */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Product Layout</h2>
        <div className={`${styles.gridDemo} ${styles.gridDemo2col}`}>
          <div className={styles.gridDemoItem} style={{minHeight: '15em'}}>
            Product Image (1fr)
          </div>
          <div className={styles.gridDemoItem} style={{minHeight: '15em'}}>
            Product Info (1fr, sticky top: 6em)
          </div>
        </div>
      </section>

      {/* Utility Classes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Utility Classes</h2>
        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Class</div>
            <div className={styles.scaleItemValue}>.sr-only</div>
            <p style={{fontSize: '0.8em', opacity: 0.6, marginTop: '0.25em'}}>
              Screen reader only, visueel verborgen
            </p>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Class</div>
            <div className={styles.scaleItemValue}>.link</div>
            <p style={{fontSize: '0.8em', opacity: 0.6, marginTop: '0.25em'}}>
              Hover underline voor niet-anchor links
            </p>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Class</div>
            <div className={styles.scaleItemValue}>button.reset</div>
            <p style={{fontSize: '0.8em', opacity: 0.6, marginTop: '0.25em'}}>
              Stripped button zonder border/background
            </p>
          </div>
          <div className={styles.scaleItem}>
            <div className={styles.scaleItemLabel}>Class</div>
            <div className={styles.scaleItemValue}>.overlay</div>
            <p style={{fontSize: '0.8em', opacity: 0.6, marginTop: '0.25em'}}>
              Achtergrond overlay voor aside panels
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
