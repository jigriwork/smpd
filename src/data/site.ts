/**
 * SMPD site content and settings.
 * Edit copy, navigation and contact details here. Components read from this file.
 *
 * Contact details are intentionally null until real ones are supplied.
 * A null value is simply not rendered on the public page.
 */

export const site = {
  name: 'SMPD',
  descriptor: 'Land & Homes',
  domain: 'smpd.in',
  url: 'https://smpd.in',
  location: 'Berhampur, Odisha',
  region: 'Berhampur & Beyond',
  title: 'SMPD | Land & Homes · Berhampur & Beyond',
  description:
    'Introducing SMPD. A new chapter in land and homes across Berhampur and beyond, backed by 70+ years of family business heritage.',

  /** Real contact details. Leave as null until confirmed. */
  contact: {
    phone: null as string | null, // e.g. '+91 98xxx xxxxx'
    email: null as string | null, // e.g. 'hello@smpd.in' once the mailbox exists
    address: null as string | null, // full office address once confirmed
  },

  /** Legal entity name and statutory details. Leave null until provided. */
  legal: {
    entityName: null as string | null,
    registration: null as string | null,
  },
};

/**
 * Enquiry delivery. Set PUBLIC_FORM_ENDPOINT in a .env file to a form service
 * that accepts JSON POSTs (for example a Formspree or Web3Forms endpoint).
 * Without it, the form explains honestly that enquiries cannot be sent yet.
 */
export const formEndpoint: string = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';

export const nav = [
  { label: 'Our Story', href: '#story' },
  { label: 'Our Focus', href: '#focus' },
  { label: 'Our Approach', href: '#approach' },
  { label: 'Connect', href: '#contact' },
];

/** Related family businesses in Berhampur, in display order. */
export const familyBusinesses = ['Ganjam Cloth Store', 'Go Planet', 'Brand Mark', 'Riwaz'];

export const hero = {
  eyebrow: 'Land & Homes · Berhampur & Beyond',
  lines: ['A legacy of trust.', 'A new foundation.'],
  body: 'Introducing SMPD. A new chapter in land and homes across Berhampur and beyond, backed by 70+ years of family business heritage.',
  primary: { label: 'Start a conversation', href: '#contact' },
  secondary: { label: 'Discover our story', href: '#story' },
};

/** Large scroll-lit statement directly below the hero. */
export const intro = {
  kicker: 'Introducing SMPD',
  statement:
    'SMPD is a property venture in land and homes, from a family that has served Berhampur for more than seventy years. The same values, brought to new ground.',
};

/** Words that run across the big moving band. */
export const marquee = ['Land', 'Homes', 'Berhampur & Beyond', 'A legacy of trust', 'A new foundation'];

/** Small facts along the bottom edge of the hero. */
export const heroFacts = ['70+ years of family heritage', 'Land & Homes'];

export const heritage = {
  figure: '70+',
  label: 'Years of family business heritage',
  attribution:
    'Our family’s commercial story, carried across generations of business in Berhampur. SMPD is a venture built on that trust.',
  thought: 'Rooted in Berhampur. Looking ahead.',
  related: 'From the family behind',
};

export const story = {
  kicker: 'Our Story',
  heading: 'The next chapter of a longstanding family story.',
  lead:
    'Our family’s business story began before India’s independence, with a first store and a commitment to serving the community.',
  paragraphs: [
    'Across generations, that story has continued through changing times, new businesses and lasting relationships in Berhampur.',
    'Today, members of the family behind Ganjam Cloth Store, Go Planet, Brand Mark and Riwaz are bringing that experience into a new field. SMPD is our next chapter: a property venture focused on land and homes, shaped by the same respect for customers and long-term relationships.',
    'We are building SMPD the same way: through careful decisions, clear communication and personal involvement, earning confidence with every step.',
  ],
  chapters: [
    { mark: 'Before Independence', text: 'A first store, and a commitment to serving the community.' },
    { mark: 'Across generations', text: 'Changing times, new businesses and lasting relationships in Berhampur.' },
    { mark: 'Today', text: 'SMPD. The family’s experience, brought to land and homes.' },
  ],
};

export const focus = {
  kicker: 'Our Focus',
  heading: 'Two areas of focus, one careful way of working.',
  intro:
    'Land and homes, approached with the same care our family has always brought to business.',
  items: [
    {
      index: '01',
      title: 'Land',
      text: 'Carefully considered land opportunities, beginning with location, access and suitability.',
      points: ['Location', 'Access', 'Suitability'],
    },
    {
      index: '02',
      title: 'Homes',
      text: 'A considered approach to acquiring land and creating homes for sale.',
      points: ['Acquisition', 'Design intent', 'Homes for sale'],
    },
  ],
};

export const approach = {
  kicker: 'Our Approach',
  heading: 'Confidence begins with clarity.',
  intro: 'How we intend to work, from the first conversation onwards.',
  principles: [
    {
      title: 'Careful property selection',
      text: 'We look closely at location, access and suitability before we put our name to an opportunity.',
    },
    {
      title: 'Clear explanations',
      text: 'We take time to explain the documents and each step of a transaction in plain language.',
    },
    {
      title: 'Transparent pricing and scope',
      text: 'We discuss pricing and what is included openly, so there is a shared understanding from the start.',
    },
    {
      title: 'Direct communication',
      text: 'You speak with the people responsible for the decisions, not a chain of intermediaries.',
    },
    {
      title: 'A long-term view',
      text: 'Our family has built relationships in Berhampur over generations. We intend to keep it that way.',
    },
  ],
};

export const nextChapter = {
  kicker: 'The Next Chapter',
  heading: 'Every new chapter starts with the right ground.',
  intro:
    'We are beginning conversations with people who share an interest in land and homes, in Berhampur and beyond.',
  invitations: [
    {
      title: 'Exploring land or a future home',
      text: 'Tell us what you are looking for and we will keep you informed as opportunities take shape.',
      interest: 'home',
    },
    {
      title: 'Landowners considering a sale',
      text: 'If you own land and are open to discussing a sale, we would be glad to hear from you.',
      interest: 'sell',
    },
    {
      title: 'Professional collaborators',
      text: 'Architects, engineers, advisors and development partners who value careful work.',
      interest: 'collab',
    },
  ],
  cta: 'Discuss an opportunity',
};

export const contactSection = {
  kicker: 'Connect',
  heading: 'Let’s talk about what comes next.',
  intro:
    'Share a few details and someone from the family will get back to you personally.',
  interests: [
    { value: 'land', label: 'Land' },
    { value: 'home', label: 'Home' },
    { value: 'sell', label: 'Sell land' },
    { value: 'collab', label: 'Collaboration' },
  ],
  consent:
    'We use your details only to respond to this enquiry. We do not sell or share them, and you can ask us to delete them at any time.',
};

export const footer = {
  line: 'Land and homes. Rooted in Berhampur, reaching beyond.',
};
