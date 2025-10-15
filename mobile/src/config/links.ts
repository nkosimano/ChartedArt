// Centralized external links used in the app
export const LINKS = {
  BLOG: 'https://chartedart.com/blog',
  EVENTS: 'https://chartedart.com/events',
  FAQ: 'https://chartedart.com/faq',
  SHIPPING: 'https://chartedart.com/shipping',
} as const;

export type LinkKey = keyof typeof LINKS;
