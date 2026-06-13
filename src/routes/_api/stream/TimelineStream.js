import { WebSocketClient } from '../../_thirdparty/websocket/websocket.js'
import { lifecycle } from '../../_utils/lifecycle.ts'
import { getStreamUrl } from './getStreamUrl.ts'
import mitt from 'mitt'
import { eventBus } from '../../_utils/eventBus.ts'
import { safeParse } from '../../_utils/safeParse.js'

export class TimelineStream {
  constructor (streamingApi, accessToken, timeline) {
    Object.assign(this, mitt())
    this._streamingApi = streamingApi
    this._accessToken = accessToken
    this._timeline = timeline
    this._onStateChange = this._onStateChange.bind(this)
    this._onOnline = this._onOnline.bind(this)
    this._onOffline = this._onOffline.bind(this)
    this._onForcedOnlineStateChange = this._onForcedOnlineStateChange.bind(this)
    this._setupWebSocket()
    this._setupEvents()
  }

  close () {
    this._closed = true
    this._closeWebSocket()
    this._teardownEvents()
    for (const event of ['open', 'close', 'reconnect', 'message']) {
      this.off(event)
    }
  }

  _closeWebSocket () {
    if (this._ws) {
      this.emit('close')
      this._ws.onopen = null
      this._ws.onmessage = null
      this._ws.onclose = null
      this._ws.close()
      this._ws = null
    }
  }

  _setupWebSocket () {
    const url = getStreamUrl(this._streamingApi, this._accessToken, this._timeline)
    const ws = new WebSocketClient(url)

    ws.onopen = () => {
      if (!this._opened) {
        this.emit('open')
        this._opened = true
      } else {
        // we may close or reopen websockets due to freeze/unfreeze events
        // and we want to fire "reconnect" rather than "open" in that case
        this.emit('reconnect')
      }
    }
    ws.onmessage = (e) => this.emit('message', safeParse(e.data))
    ws.onclose = () => this.emit('close')
    // The ws "onreconnect" event seems unreliable. When the server goes down and comes back up,
    // it doesn't fire (but "open" does). When we freeze and unfreeze, it fires along with the
    // "open" event. The above is my attempt to normalize it.

    this._ws = ws
  }

  _setupEvents () {
    lifecycle.addEventListener('statechange', this._onStateChange)
    eventBus.on('forcedOnline', this._onForcedOnlineStateChange) // only happens in tests
    window.addEventListener('online', this._onOnline)
    window.addEventListener('offline', this._onOffline)
  }

  _teardownEvents () {
    lifecycle.removeEventListener('statechange', this._onStateChange)
    eventBus.off('forcedOnline', this._onForcedOnlineStateChange) // only happens in tests
    window.removeEventListener('online', this._onOnline)
    window.removeEventListener('offline', this._onOffline)
  }

  _pause () {
    if (this._closed) {
      return
    }
    this._closeWebSocket()
  }

  // Resume/restore the connection without redundant churn:
  //  - no socket (we were paused/closed) -> create a fresh one
  //  - have a socket that isn't open     -> reset the backoff and reconnect it
  //  - already open                      -> no-op
  // Replaces the old _unpause()+_tryToReconnect() pair, which on unfreeze/online fired *both*
  // (recreating the socket and then immediately resetting it), and tore down a perfectly open
  // socket on a spurious "online" event.
  _ensureConnected () {
    if (this._closed) {
      return
    }
    if (!this._ws) {
      this._setupWebSocket()
    } else if (this._ws.readyState !== WebSocketClient.OPEN) {
      // reset the backoff counter so fresh notifications come in faster
      this._ws.reset()
      this._ws.reconnect()
    }
  }

  _onStateChange (event) {
    // pause websocket polling while the page is frozen; restore it on unfreeze or re-activation
    if (event.newState === 'frozen') {
      this._pause()
    } else if (event.oldState === 'frozen' || event.newState === 'active') {
      this._ensureConnected()
    }
  }

  _onOnline () {
    this._ensureConnected()
  }

  _onOffline () {
    this._pause() // in testing, it seems to work better to stop polling when we get this event
  }

  _onForcedOnlineStateChange (online) {
    if (online) {
      this._ensureConnected()
    } else {
      this._pause()
    }
  }
}
