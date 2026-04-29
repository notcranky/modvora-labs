'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'build_complete'
  actorName: string
  actorHandle: string
  actorAvatar?: string
  postId?: string
  postTitle?: string
  commentText?: string
  read: boolean
  createdAt: string
}

const notificationIcons = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  mention: '@',
  share: '🔗',
  build_complete: '🏁'
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return then.toLocaleDateString()
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const getMessage = () => {
    switch (notification.type) {
      case 'like':
        return `liked your post "${notification.postTitle?.slice(0, 30)}${notification.postTitle && notification.postTitle.length > 30 ? '...' : ''}"`
      case 'comment':
        return `commented: "${notification.commentText?.slice(0, 40)}${notification.commentText && notification.commentText.length > 40 ? '...' : ''}"`
      case 'follow':
        return 'started following you'
      case 'mention':
        return `mentioned you in a comment`
      case 'share':
        return `shared your post`
      case 'build_complete':
        return 'your build is ready!'
      default:
        return 'interacted with you'
    }
  }

  const linkHref = notification.postId 
    ? `/community/${notification.postId}`
    : `/community/profile/${notification.actorHandle}`

  return (
    <Link
      href={linkHref}
      onClick={() => onRead(notification.id)}
      className={`
        flex items-start gap-3 p-4 hover:bg-[#1a1a20] transition-colors
        ${!notification.read ? 'bg-purple-500/5 border-l-2 border-purple-500' : ''}
      `}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-lg shrink-0">
        {notificationIcons[notification.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <img
            src={notification.actorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${notification.actorName}`}
            alt={notification.actorName}
            className="w-8 h-8 rounded-full bg-zinc-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              <span className="font-semibold">{notification.actorName}</span>
              {' '}
              <span className="text-zinc-400">{getMessage()}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
          </div>
        </div>
      </div>
      
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
      )}
    </Link>
  )
}

interface NotificationsCenterProps {
  userId: string
}

export default function NotificationsCenter({ userId }: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (username, handle, avatar_url)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      const notifs = data.map((n: any) => ({
        id: n.id,
        type: n.type,
        actorName: n.actor?.username || 'Someone',
        actorHandle: n.actor?.handle || 'unknown',
        actorAvatar: n.actor?.avatar_url,
        postId: n.post_id,
        postTitle: n.post_title,
        commentText: n.comment_text,
        read: n.read,
        createdAt: n.created_at
      }))

      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.read).length)
      setLoading(false)
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new as any
        setNotifications(prev => [{
          id: newNotif.id,
          type: newNotif.type,
          actorName: newNotif.actor?.username || 'Someone',
          actorHandle: newNotif.actor?.handle || 'unknown',
          actorAvatar: newNotif.actor?.avatar_url,
          postId: newNotif.post_id,
          postTitle: newNotif.post_title,
          commentText: newNotif.comment_text,
          read: false,
          createdAt: newNotif.created_at
        }, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false)
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-[#1a1a20] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[500px] overflow-hidden bg-[#16161a] border border-[#2a2a30] rounded-2xl shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a30]">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">Like and comment to get started!</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
