/**
 * TSE Website Manager Supabase Realtime Synchronization Service
 * 
 * Provides instant (<50ms) cross-client broadcast synchronization between
 * multiple administrative sessions (e.g. Mac & Deb) while keeping the
 * SQLite / Express backend as the authoritative source of truth.
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL)
  ? process.env.VITE_SUPABASE_URL
  : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
      ? import.meta.env.VITE_SUPABASE_URL
      : 'https://cbdfjdxqhqajzjblysqd.supabase.co')

const SUPABASE_KEY = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
      ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      : 'sb_publishable_Ys5D-QcdSw_gac9YkmKMZg_eLGCfmK5')

// Initialize singleton Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
})

// Unique Client / Session ID to prevent self-echo and update loops
export function getClientId() {
  if (typeof window === 'undefined') return 'server_or_worker'
  if (!window.__TSE_WM_CLIENT_ID__) {
    window.__TSE_WM_CLIENT_ID__ = 'wm_client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  }
  return window.__TSE_WM_CLIENT_ID__
}

// Realtime Event Names
export const REALTIME_EVENTS = {
  WEBSITE_CHANGED: 'website_changed',
  PAGE_CONFIG_CHANGED: 'page_config_changed',
  PAGE_AUDIT_CHANGED: 'page_audit_changed',
  PACKAGE_SYNCED: 'package_synced',
  LINK_REC_CHANGED: 'link_rec_changed',
  DEPLOYMENT_STATUS_CHANGED: 'deployment_status_changed'
}

const CHANNEL_NAME = 'tse-website-manager-realtime'
let sharedChannel = null
let channelSubscriptionStatus = 'CLOSED'
const registeredListeners = new Set()

/**
 * Ensures the singleton shared broadcast channel is subscribed.
 */
function getOrCreateSharedChannel() {
  if (sharedChannel) return sharedChannel

  sharedChannel = supabase.channel(CHANNEL_NAME, {
    config: {
      broadcast: { self: false } // Supabase flag: do not echo back to sender if supported
    }
  })

  // Listen to all broadcast events
  sharedChannel.on('broadcast', { event: '*' }, (message) => {
    const { event, payload } = message || {}
    if (!event || !payload) return

    // Strict self-echo prevention: ignore messages originating from this browser session
    const currentClientId = getClientId()
    if (payload.senderId && payload.senderId === currentClientId) {
      return
    }

    // Dispatch to all active component listeners
    registeredListeners.forEach((listener) => {
      try {
        listener(event, payload)
      } catch (err) {
        console.error('[Supabase Realtime] Listener error:', err)
      }
    })
  })

  sharedChannel.subscribe((status, err) => {
    channelSubscriptionStatus = status
    if (status === 'SUBSCRIBED') {
      console.log('[Supabase Realtime] Connected to channel:', CHANNEL_NAME)
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      console.warn('[Supabase Realtime] Channel status:', status, err || '')
    }
  })

  return sharedChannel
}

/**
 * Broadcast an event to all other open Website Manager sessions.
 * 
 * @param {string} eventType - One of REALTIME_EVENTS
 * @param {object} payload - Event payload (siteId, data, etc.)
 */
export async function broadcastWebsiteManagerEvent(eventType, payload = {}) {
  try {
    const ch = getOrCreateSharedChannel()
    const senderId = getClientId()
    const fullPayload = {
      ...payload,
      senderId,
      timestamp: Date.now()
    }

    await ch.send({
      type: 'broadcast',
      event: eventType,
      payload: fullPayload
    })
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast error:', err)
  }
}

/**
 * Custom React Hook to subscribe to realtime Website Manager updates.
 * Automatically cleans up on component unmount and avoids duplicate registrations.
 * 
 * @param {object} handlers - Map of event callbacks:
 *   {
 *     onWebsiteChanged: ({ action, siteId, site, senderId, timestamp }) => void,
 *     onPageConfigChanged: ({ siteId, configsMap, pageKey, senderId, timestamp }) => void,
 *     onPageAuditChanged: ({ siteId, pageKey, auditRecord, auditsMap, senderId, timestamp }) => void,
 *     onPackageSynced: ({ siteId, timestamp, senderId }) => void,
 *     onLinkRecChanged: ({ siteId, recKey, recommendationsMap, senderId, timestamp }) => void,
 *     onDeploymentStatusChanged: ({ deploymentStatus, senderId, timestamp }) => void,
 *     onReconnect: () => void
 *   }
 */
export function useWebsiteManagerRealtime(handlers = {}) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    getOrCreateSharedChannel()

    const listener = (event, payload) => {
      const h = handlersRef.current || {}
      switch (event) {
        case REALTIME_EVENTS.WEBSITE_CHANGED:
          if (typeof h.onWebsiteChanged === 'function') h.onWebsiteChanged(payload)
          break
        case REALTIME_EVENTS.PAGE_CONFIG_CHANGED:
          if (typeof h.onPageConfigChanged === 'function') h.onPageConfigChanged(payload)
          break
        case REALTIME_EVENTS.PAGE_AUDIT_CHANGED:
          if (typeof h.onPageAuditChanged === 'function') h.onPageAuditChanged(payload)
          break
        case REALTIME_EVENTS.PACKAGE_SYNCED:
          if (typeof h.onPackageSynced === 'function') h.onPackageSynced(payload)
          break
        case REALTIME_EVENTS.LINK_REC_CHANGED:
          if (typeof h.onLinkRecChanged === 'function') h.onLinkRecChanged(payload)
          break
        case REALTIME_EVENTS.DEPLOYMENT_STATUS_CHANGED:
          if (typeof h.onDeploymentStatusChanged === 'function') h.onDeploymentStatusChanged(payload)
          break
        default:
          break
      }
    }

    registeredListeners.add(listener)

    // Reconnection and window focus handler to ensure freshest state
    const handleFocus = () => {
      if (handlersRef.current && typeof handlersRef.current.onReconnect === 'function') {
        handlersRef.current.onReconnect()
      }
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      registeredListeners.delete(listener)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
