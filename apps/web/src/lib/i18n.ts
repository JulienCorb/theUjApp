// TODO(i18n): setup i18n library (react-i18next or similar)
// - Define locale resources structure
// - Configure language detection (browser, localStorage, URL)
// - Provide useTranslation hook for components
// - Integrate with TanStack Router for route-level locale

export function useTranslation() {
  return { t: (key: string) => key }
}