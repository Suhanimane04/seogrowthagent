// src/app/reports/layout.tsx
// FIX: Removed the duplicate <Sidebar /> that was causing the double sidebar.
// Next.js nests layouts — reports/[id]/layout.tsx already wraps children in
// its own Sidebar+main shell, so having one here too rendered TWO sidebars
// when viewing a report detail page.
// The top-level app layout (src/app/layout.tsx) handles the outer shell;
// each section only needs ONE layout that adds the sidebar.

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}