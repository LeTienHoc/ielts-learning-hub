import { BrandMark } from "@/components/shared/brand-mark"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="mx-auto flex h-header w-full max-w-content items-center justify-between px-4 md:px-6">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <main
        id="main-content"
        className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center"
      >
        {children}
      </main>
    </div>
  )
}
