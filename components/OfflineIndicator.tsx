'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setupOfflineIndicator, getConnectionQuality, ConnectionQuality } from '@/lib/offline'
import { offlineQueue } from '@/lib/offline'

export default function OfflineIndicator() {
  const [status, setStatus] = useState<{ online: boolean; quality: ConnectionQuality }>({
    online: true,
    quality: 'good'
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Set up offline monitoring
    const cleanup = setupOfflineIndicator(setStatus)
    
    // Subscribe to queue updates
    const unsubscribe = offlineQueue.subscribe((queue) => {
      setPendingCount(queue.length)
    })

    // Initial check
    setStatus({
      online: navigator.onLine,
      quality: getConnectionQuality()
    })

    return () => {
      cleanup()
      unsubscribe()
    }
  }, [])

  // Don't show anything if online with good connection and no pending actions
  if (status.online && status.quality !== 'poor' && pendingCount === 0) {
    return null
  }

  const getStatusConfig = () => {
    if (!status.online) {
      return {
        icon: '📡',
        color: 'bg-red-500',
        text: 'Offline',
        subtext: `${pendingCount} action${pendingCount !== 1 ? 's' : ''} queued`
      }
    }
    
    switch (status.quality) {
      case 'excellent':
        return {
          icon: '✓',
          color: 'bg-green-500',
          text: 'Connected',
          subtext: pendingCount > 0 ? `Syncing ${pendingCount} actions...` : ''
        }
      case 'good':
        return {
          icon: '✓',
          color: 'bg-green-500',
          text: 'Connected',
          subtext: pendingCount > 0 ? `Syncing ${pendingCount} actions...` : ''
        }
      case 'slow':
        return {
          icon: '⚡',
          color: 'bg-yellow-500',
          text: 'Slow Connection',
          subtext: 'Some features may be limited'
        }
      case 'poor':
        return {
          icon: '⚠️',
          color: 'bg-orange-500',
          text: 'Poor Connection',
          subtext: 'Operating in low-bandwidth mode'
        }
      default:
        return {
          icon: '?',
          color: 'bg-zinc-500',
          text: 'Unknown',
          subtext: ''
        }
    }
  }

  const config = getStatusConfig()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div 
          className={`${config.color} text-white px-4 py-2 flex items-center justify-between cursor-pointer`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <div>
              <span className="font-semibold">{config.text}</span>
              {config.subtext && (
                <span className="ml-2 text-sm opacity-90">{config.subtext}</span>
              )}
            </div>
          </div>
          
          {pendingCount > 0 && status.online && (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
          
          <svg 
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="bg-[#16161a] border-b border-[#2a2a30] overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Connection Quality</span>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${status.quality === 'excellent' ? 'bg-green-500/20 text-green-400' : ''}
                    ${status.quality === 'good' ? 'bg-green-500/20 text-green-400' : ''}
                    ${status.quality === 'slow' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${status.quality === 'poor' ? 'bg-orange-500/20 text-orange-400' : ''}
                    ${!status.online ? 'bg-red-500/20 text-red-400' : ''}
                  `}>
                    {status.quality}
                  </span>
                </div>
                
                {pendingCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Pending Actions</span>
                    <span className="text-white font-medium">{pendingCount}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Offline Mode</span>
                  <span className="text-green-400 text-sm">
                    {navigator.onLine ? 'Enabled' : 'Active'}
                  </span>
                </div>

                {!status.online && (
                  <p className="text-xs text-zinc-500">
                    Don't worry! Your likes, comments, and other actions are saved and will sync when you're back online.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
