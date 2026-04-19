'use client'

import { useEffect, useRef, useState } from 'react'
import { AppNotification, getUnreadCount, loadNotifications, markAllRead } from '@/lib/notifications'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'like') {
    return (
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
    )
  }
  if (type === 'comment_like') {
    return (
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </div>
    )
  }
  if (type === 'comment_reply') {
    return (
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
          <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
      </div>
    )
  }
  // comment
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  )
}

function NotifText({ n }: { n: AppNotification }) {
  if (n.type === 'like') {
    return <><span className="font-medium text-white">Someone</span> liked <span className="font-medium text-white">{n.postTitle}</span></>
  }
  if (n.type === 'comment') {
    return <><span className="font-medium text-white">{n.actorName}</span> commented on <span className="font-medium text-white">{n.postTitle}</span></>
  }
  if (n.type === 'comment_like') {
    return <>Someone liked your comment on <span className="font-medium text-white">{n.postTitle}</span></>
  }
  if (n.type === 'comment_reply') {
    return <><span className="font-medium text-white">{n.actorName}</span> replied to your comment on <span className="font-medium text-white">{n.postTitle}</span></>
  }
  return null
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(loadNotifications())
    setUnread(getUnreadCount())
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    if (!open) {
      setNotifications(loadNotifications())
      setUnread(getUnreadCount())
    }
    setOpen((v) => !v)
    if (!open) {
      setTimeout(() => {
        markAllRead()
        setUnread(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }, 800)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#2a2a35] bg-[#18181f] text-zinc-400 transition-colors hover:text-white"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth={1.8}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-[20px] border border-[#2a2a35] bg-[#101014] shadow-2xl">
          <div className="border-b border-[#1e1e25] px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-[#1a1a20] last:border-0 ${n.read ? '' : 'bg-purple-500/5'}`}>
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 leading-snug">
                      <NotifText n={n} />
                    </p>
                    {n.context && (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-600 italic">&quot;{n.context}&quot;</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-zinc-600">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-500" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
