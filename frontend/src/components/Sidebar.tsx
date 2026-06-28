'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LayoutDashboard, PlusCircle, FileText, TrendingUp, LogOut, User, Sparkles, Share2, BarChart3, Building2, Bell } from 'lucide-react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { getNotifications, getUnreadCount, markAllNotificationsRead } from '@/lib/api'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'New Analysis', icon: PlusCircle },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/prompts', label: 'Prompt Agent', icon: Sparkles },
  { href: '/social', label: 'Social Media', icon: Share2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile/setup', label: 'Business Profile', icon: Building2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  // needed for createPortal — only works client-side
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const load = () => getUnreadCount().then((r) => setUnread(r.data.count)).catch(() => {})
    load()
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      const panel = document.getElementById('notif-panel')
      if (panel && panel.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openPanel = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      try {
        const { data } = await getNotifications()
        setNotifs(data)
      } catch {}
    }
  }

  const clearAll = async () => {
    await markAllNotificationsRead()
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  // Get button position to place panel below it
  const getBtnRect = () => btnRef.current?.getBoundingClientRect()

  const notifPanel = mounted && open ? createPortal(
    <div
      id="notif-panel"
      style={{
        position: 'fixed',
        top: (getBtnRect()?.bottom ?? 60) + 8,
        left: (getBtnRect()?.left ?? 220),
        width: 300,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        zIndex: 99999,
        maxHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        background: '#fafafa'
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
          Notifications {unread > 0 && <span style={{ color: '#6366f1' }}>({unread} unread)</span>}
        </span>
        <button
          onClick={clearAll}
          style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Mark all read
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifs.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', padding: 16, textAlign: 'center', margin: 0 }}>
            No notifications yet.
          </p>
        ) : notifs.map((n) => (
          <div key={n.id} style={{
            padding: '10px 16px',
            borderBottom: '1px solid #f8fafc',
            background: n.is_read ? '#fff' : '#f0f4ff',
          }}>
            <p style={{ fontSize: 13, color: '#334155', fontWeight: n.is_read ? 400 : 600, margin: '0 0 4px' }}>
              {n.message}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    // Single <aside> — no fragment — so it works as a direct flex child in any layout
    <aside
      style={{
        width: 256,
        minHeight: '100vh',
        background: '#1e1b4b',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {notifPanel}

      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ width: 22, height: 22, color: '#a5b4fc' }} />
            <span style={{ fontWeight: 700, fontSize: 17 }}>SEO Growth AI</span>
          </div>
          <button
            ref={btnRef}
            onClick={openPanel}
            style={{
              position: 'relative', padding: 6, borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            <Bell style={{ width: 20, height: 20, color: '#a5b4fc' }} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: '#ef4444', color: '#fff',
                fontSize: 10, borderRadius: 999, minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, padding: '0 3px'
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                textDecoration: 'none', transition: 'background 0.15s',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : '#a5b4fc',
              }}
            >
              <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ background: '#818cf8', borderRadius: '50%', padding: 6, flexShrink: 0 }}>
            <User style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 11, color: '#a5b4fc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            color: '#a5b4fc', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, width: '100%', borderRadius: 8, transition: 'color 0.15s',
          }}
        >
          <LogOut style={{ width: 15, height: 15 }} /> Sign out
        </button>
      </div>
    </aside>
  )
}