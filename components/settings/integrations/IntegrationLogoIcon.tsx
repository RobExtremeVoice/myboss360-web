import { cn } from '@/lib/utils'
import type { IntegrationProvider } from '@/types/integrations'

type LogoConfig = {
  label: string
  /** Tailwind bg class */
  bg: string
  /** Tailwind text class */
  text: string
}

// Inline styles are used for non-standard hex values that Tailwind cannot
// purge-safely generate from arbitrary strings at build time.
type LogoConfigWithStyle = LogoConfig & {
  bgStyle?: string
  textStyle?: string
}

const LOGO_MAP: Record<IntegrationProvider, LogoConfigWithStyle> = {
  google_gmail:       { label: 'G',  bgStyle: 'rgba(66,133,244,0.10)',  textStyle: '#4285F4', bg: '', text: '' },
  google_calendar:    { label: 'G',  bgStyle: 'rgba(66,133,244,0.10)',  textStyle: '#4285F4', bg: '', text: '' },
  google_contacts:    { label: 'G',  bgStyle: 'rgba(66,133,244,0.10)',  textStyle: '#4285F4', bg: '', text: '' },
  google_drive:       { label: 'G',  bgStyle: 'rgba(66,133,244,0.10)',  textStyle: '#4285F4', bg: '', text: '' },
  microsoft_outlook:  { label: 'M',  bgStyle: 'rgba(0,164,239,0.10)',   textStyle: '#00A4EF', bg: '', text: '' },
  microsoft_onedrive: { label: 'M',  bgStyle: 'rgba(0,164,239,0.10)',   textStyle: '#00A4EF', bg: '', text: '' },
  microsoft_teams:    { label: 'M',  bgStyle: 'rgba(0,164,239,0.10)',   textStyle: '#00A4EF', bg: '', text: '' },
  salesforce:         { label: 'S',  bgStyle: 'rgba(0,161,224,0.10)',   textStyle: '#00A1E0', bg: '', text: '' },
  hubspot:            { label: 'H',  bgStyle: 'rgba(255,122,89,0.10)',  textStyle: '#FF7A59', bg: '', text: '' },
  slack:              { label: '#',  bgStyle: 'rgba(74,21,75,0.10)',    textStyle: '#4A154B', bg: '', text: '' },
  zoom:               { label: 'Z',  bgStyle: 'rgba(45,140,255,0.10)',  textStyle: '#2D8CFF', bg: '', text: '' },
  openai:             { label: 'AI', bgStyle: 'rgba(2,8,23,0.10)',      textStyle: '#020817', bg: '', text: '' },
  anthropic:          { label: 'C',  bgStyle: 'rgba(212,165,116,0.10)', textStyle: '#92610A', bg: '', text: '' },
  gemini:             { label: 'G',  bgStyle: 'rgba(139,92,246,0.10)',  textStyle: '#8B5CF6', bg: '', text: '' },
  ollama:             { label: 'O',  bg: 'bg-emerald-50', text: 'text-emerald-700', bgStyle: undefined, textStyle: undefined },
  perplexity:         { label: 'P',  bg: 'bg-teal-50',    text: 'text-teal-600',   bgStyle: undefined, textStyle: undefined },
}

type Props = {
  provider: IntegrationProvider
  className?: string
}

export function IntegrationLogoIcon({ provider, className }: Props) {
  const config = LOGO_MAP[provider]

  return (
    <div
      className={cn(
        'flex size-10 items-center justify-center rounded-xl border border-black/6 text-sm font-bold',
        config.bg,
        config.text,
        className,
      )}
      style={{
        backgroundColor: config.bgStyle ?? undefined,
        color: config.textStyle ?? undefined,
      }}
    >
      {config.label}
    </div>
  )
}
