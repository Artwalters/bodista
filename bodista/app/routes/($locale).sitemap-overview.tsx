import type {Route} from './+types/sitemap-overview';
import styles from '~/styles/sitemap.module.css';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Project Site Map'}];
};

/* ==========================================================================
   Helper Components
   ========================================================================== */

function PageCard({
  title,
  sections,
}: {
  title: string;
  sections: {name: string; description?: string; type?: 'navbar' | 'footer'}[];
}) {
  return (
    <div className={styles.pageCard}>
      <div className={styles.pageCardHeader}>
        <span className={styles.pageCardTitle}>{title}</span>
      </div>
      <div className={styles.pageCardBody}>
        {sections.map((section, i) => (
          <div
            key={i}
            className={`${styles.sectionBlock} ${
              section.type === 'navbar' ? styles.sectionBlockNavbar : ''
            } ${section.type === 'footer' ? styles.sectionBlockFooter : ''}`}
          >
            <div className={styles.sectionName}>{section.name}</div>
            {section.description && (
              <div className={styles.sectionDesc}>{section.description}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className={styles.connector}>
      <div className={styles.connectorLine} />
    </div>
  );
}

function SubConnector() {
  return (
    <div className={styles.subPageConnector}>
      <div className={styles.subPageConnectorLine} />
    </div>
  );
}

/* ==========================================================================
   Page Data
   ========================================================================== */

const homeSections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Hero Header Section',
    description:
      'Full-width video background of sensual rituals with strong editorial copy and a primary CTA button inviting users to begin their ritual.',
  },
  {
    name: 'Features List Section',
    description:
      'Scrolling marquee/banner with personal quotes and quality statements focused on ingredient integrity, pleasure, ritual, and body intelligence.',
  },
  {
    name: 'Liquid Gold',
    description:
      'Video of bottle filling up ref the Nue CO.DE. Whats inside matters / the universal Standard.',
  },
  {
    name: 'Header Section',
    description:
      "Introduction to Bodista\u2019s brand philosophy, emphasizing collaboration with nature, oil-based skin rituals, and the body\u2019s own healing systems.",
  },
  {
    name: 'Features List Section',
    description:
      'Preview of three key products with hover interactions and subtle transitions highlighting product uniqueness and sensory experience.',
  },
  {
    name: 'Features List Section',
    description:
      'Grid of four ritual advocate videos; each advocate performs their Bodista ritual and links to their story with an editorial feel.',
  },
  {name: 'Layout'},
  {name: 'Product'},
  {
    name: 'Testimonial Section',
    description:
      'Horizontal reviews banner featuring short, calming, trust-building testimonials in human language.',
  },
  {
    name: 'Features List Section',
    description:
      'Editorial-style social grid previewing rituals, ingredients, and human moments with minimal captions.',
  },
  {name: 'Deep dive preview blog'},
  {name: 'Footer', type: 'footer' as const},
];

const shopAllSections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Header Section',
    description:
      'Editorial, grounded introduction to the full Bodista collection\u2014inviting users to explore oil-based, pleasure-forward self-care products and ritual sets.',
  },
  {
    name: 'Ecommerce Products List Section',
    description:
      'A visually immersive grid of all Bodista products and ritual sets, featuring product name, price, and quick-view option with hover effects.',
  },
  {
    name: 'CTA Section',
    description:
      'Encouraging users to begin their ritual with a call-to-action inviting them to discover their perfect set or product.',
  },
  {
    name: 'FAQ Section',
    description:
      'Short, expandable FAQs addressing common questions about Bodista products, rituals, and ingredients.',
  },
  {name: 'Footer', type: 'footer' as const},
];

const productSections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Ecommerce Product Header Section',
    description:
      'Processed product image with concise, editorial-style description, product name, and key sensory highlights.',
  },
  {
    name: 'Stats',
    description:
      'Showcasing ingredient only 6 ingredients, 10% botanical net synthetics.',
  },
  {
    name: 'Layout',
    description:
      'Showcasing how to apply, different steps of felt ritual. Step-by-step ritual instructions for how to use the product as part of a holistic self-care routine.',
  },
  {
    name: 'Liquid Gold Standard',
    description: '10 second loop of bottle filling of this product.',
  },
  {
    name: 'Features List Section',
    description:
      "Ingredients showcase: each ingredient\u2019s origin, function, integrity, and reason for inclusion, written with transparency and reverence.",
  },
  {
    name: 'How It Works Section',
    description:
      'Step-by-step ritual instructions for how to use the product as part of a holistic self-care routine.',
  },
  {
    name: 'Reviews Section',
    description:
      'Customer reviews reflecting both pleasure and trust-building experiences.',
  },
  {
    name: 'FAQ Section',
    description:
      'Expandable short FAQ addressing common product questions (usage, storage, skin compatibility, etc.).',
  },
  {name: 'Footer', type: 'footer' as const},
];

const botanicalsSections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Hero Header Section',
    description:
      "Striking hero section featuring a close-up of lush botanicals and a poetic introduction to Bodista\u2019s reverence for plants as the foundation of every ritual.",
  },
  {
    name: 'Timeline Section',
    description:
      'Four-step visual timeline illustrating the production process: 1) Harvest (plants gathered at peak potency), 2) Origin Story (sharing the unique story and terroir of each botanical), 3) Extraction (gentle, slow extraction methods to preserve integrity), 4) Blending & Bottling (artisanal blending and careful bottling rituals).',
  },
  {
    name: 'Feature Section',
    description:
      "Highlight how Bodista\u2019s natural, protocol-led approach differs radically from synthetic, mass-market alternatives\u2014detailing ingredient integrity, absence of fillers, and the synergy of skin + scent.",
  },
  {name: 'Comparison'},
  {
    name: 'Feature Section',
    description:
      "Immersive section telling the personal story of a featured farmer or wildcrafter, with images or video and a narrative about their relationship with the land and their contribution to Bodista\u2019s botanicals.",
  },
  {name: 'Footer', type: 'footer' as const},
];

const ourStorySections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Header Section',
    description:
      "Editorial introduction with manifesto statement and video background, setting the tone for Bodista\u2019s philosophy and mission.",
  },
  {
    name: 'Feature Section',
    description:
      "The Founding Story. Narrative about the inspiration, journey, and pivotal moments that led to Bodista\u2019s creation.",
  },
  {
    name: 'Blog Post Body Section',
    description: 'Vaughns founders story of building Bodista.',
  },
  {
    name: 'Feature Section',
    description:
      "The Why: Honest explanation of the deeper purpose behind Bodista\u2014why the brand exists, its commitment to radical integrity, and what it\u2019s changing in self-care.",
  },
  {
    name: 'Features List Section',
    description:
      'Bodista Pillars: Display of 9 core themes (body intelligence, ritual, pleasure, integrity, scent, education, nature, slowness, protocol) with icons and brief explanations.',
  },
  {name: 'Product'},
  {name: 'Footer', type: 'footer' as const},
];

const librarySections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Header Section',
    description:
      'Editorial hero introduction: \u201CThe Bodista Library \u2013 Rituals, Knowledge, and Conversation.\u201D Calm, text-forward, sets the tone for timeless, educational content.',
  },
  {
    name: 'Featured Blog List Section',
    description:
      'Curated selection of featured editorial pieces, educational articles, and rituals to introduce visitors to key content.',
  },
  {
    name: 'Blog List Section',
    description:
      'Main list/grid of all published articles, rituals, conversations, and protocols, filterable by topic or category (e.g., Rituals, Ingredients, Conversations, Education).',
  },
  {
    name: 'Testimonial Section',
    description:
      'Editorial pull-quotes or short testimonials from readers or community members expressing the impact or value of the library content.',
  },
  {
    name: 'Newsletter Section',
    description:
      "Calm, minimal newsletter signup inviting visitors to receive Bodista\u2019s editorial letters, rituals, and education\u2014framed as joining an ongoing conversation.",
  },
  {name: 'Footer', type: 'footer' as const},
];

const blogPostSections = [
  {name: 'Navbar', type: 'navbar' as const},
  {
    name: 'Blog Post Header Section',
    description:
      'Editorial, minimal header featuring the post title, author, publish date, and a featured image or video, maintaining calm and text-forward design.',
  },
  {
    name: 'Testimonial Section',
    description:
      'Optional sidebar or inline highlights for short, human testimonials or reader reflections relevant to the topic.',
  },
  {
    name: 'CTA Section',
    description:
      'Subtle, editorial call-to-action inviting readers to explore related rituals, join the newsletter, or discover Bodista sets and protocols.',
  },
  {name: 'Content'},
  {
    name: 'FAQ Section',
    description:
      'Expandable FAQ addressing common questions or clarifying educational points from the post, enhancing transparency and trust.',
  },
  {name: 'Footer', type: 'footer' as const},
];

/* ==========================================================================
   Page Component
   ========================================================================== */

export default function SitemapOverview() {
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1>Project Site Map</h1>
        <p>
          Visueel overzicht van alle pagina&apos;s, secties en hun
          onderlinge verbindingen binnen de Bodista website.
        </p>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.legendSwatchDark}`} />
          <span>Pagina header</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={`${styles.legendSwatch} ${styles.legendSwatchLight}`}
          />
          <span>Navbar / Footer</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={`${styles.legendSwatch} ${styles.legendSwatchWhite}`}
          />
          <span>Content sectie</span>
        </div>
      </div>

      {/* ================================================================
          HOME (Primary Page)
          ================================================================ */}
      <div className={styles.primarySection}>
        <PageCard title="Home" sections={homeSections} />
      </div>

      {/* Connector: Home → Children */}
      <div
        className={styles.connectorHorizontal}
        style={
          {
            '--branch-left': '12.5%',
            '--branch-right': '12.5%',
          } as React.CSSProperties
        }
      >
        <div className={styles.connectorDrop} />
        <div className={styles.connectorDrop} />
        <div className={styles.connectorDrop} />
        <div className={styles.connectorDrop} />
      </div>

      {/* ================================================================
          CHILD PAGES — Row 1
          ================================================================ */}
      <div className={styles.childrenGrid}>
        {/* Shop All */}
        <div className={styles.subPageWrapper}>
          <PageCard title="Shop All" sections={shopAllSections} />
        </div>

        {/* Product → Botanicals */}
        <div className={styles.subPageWrapper}>
          <PageCard title="Product" sections={productSections} />
          <SubConnector />
          <PageCard title="Botanicals Page" sections={botanicalsSections} />
        </div>

        {/* Our Story */}
        <div className={styles.subPageWrapper}>
          <PageCard title="Our Story" sections={ourStorySections} />
        </div>

        {/* The Bodista Library → Blog Post */}
        <div className={styles.subPageWrapper}>
          <PageCard title="The Bodista Library" sections={librarySections} />
          <SubConnector />
          <PageCard title="Blog Post" sections={blogPostSections} />
        </div>
      </div>
    </div>
  );
}
