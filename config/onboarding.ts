export const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Retail & E-commerce',
  'Manufacturing',
  'Real Estate',
  'Education',
  'Consulting & Professional Services',
  'Media & Entertainment',
  'Logistics & Supply Chain',
  'Energy & Utilities',
  'Construction',
  'Legal',
  'Non-Profit',
  'Other',
] as const

export const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-1000', label: '201–1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
] as const

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Brazil',
  'India',
  'Singapore',
  'Netherlands',
  'Spain',
  'Italy',
  'Mexico',
  'Japan',
  'South Korea',
  'Other',
] as const

export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'BRL', label: 'BRL — Brazilian Real' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'MXN', label: 'MXN — Mexican Peso' },
] as const

export const BUSINESS_GOALS = [
  'Grow revenue',
  'Expand to new markets',
  'Improve team productivity',
  'Close more deals faster',
  'Reduce churn',
  'Launch a new product',
  'Raise funding',
  'Build strategic partnerships',
  'Improve customer satisfaction',
  'Scale operations',
] as const

export const COMMUNICATION_STYLES = [
  { value: 'direct', label: 'Direct — straight to the point' },
  { value: 'collaborative', label: 'Collaborative — team-oriented' },
  { value: 'analytical', label: 'Analytical — data-first' },
  { value: 'visionary', label: 'Visionary — big picture' },
] as const

export const AI_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'concise', label: 'Concise' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
] as const

export const MEETING_STYLES = [
  { value: 'structured', label: 'Structured — agenda-driven' },
  { value: 'flexible', label: 'Flexible — open discussion' },
  { value: 'async-first', label: 'Async-first — minimize meetings' },
] as const

export const DECISION_STYLES = [
  { value: 'data-driven', label: 'Data-driven' },
  { value: 'intuitive', label: 'Intuitive' },
  { value: 'consensus', label: 'Consensus-based' },
  { value: 'delegative', label: 'Delegative' },
] as const
