import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/config/theme"

/**
 * Blocking inline script rendered in <head>. It applies the stored (or system)
 * theme class before the first paint so there is no light/dark flash.
 * The ThemeProvider keeps the class in sync after hydration.
 */
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||${JSON.stringify(DEFAULT_THEME)};var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
