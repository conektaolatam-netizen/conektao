

# Plan: Fix ALICIA Connection Stability (Final)

## Root Cause (from console logs)

The logs show this pattern:
```
ALICIA connected
ALICIA disconnected
ALICIA connected
ALICIA disconnected
Failed to start ALICIA: Session cancelled during connection
ALICIA connected
ALICIA disconnected
```

**"Session cancelled during connection"** means `endSession()` is being called while `startSession()` is still connecting. This happens because:

1. **Duplicate status management**: The component maintains its OWN `status` state (`useState`) while the SDK already provides `conversation.status`. These get out of sync, causing conflicting state transitions.

2. **Unstable `startConversation` callback**: It depends on `[conversation, status]`. When `isMicMuted` changes, `useConversation` re-renders and may produce a new `conversation` reference, invalidating the callback and potentially triggering re-connection logic.

3. **`endConversation` called during connect**: When `handleClose` or any state change fires while status is `'connecting'`, it calls `endSession()` mid-handshake, producing the "Session cancelled" error.

## Solution

### 1. Remove duplicate status -- use SDK's built-in `conversation.status`

The SDK already returns `status: 'connected' | 'disconnected'`. We only need a small local flag for `'connecting'` state. This eliminates all sync conflicts.

### 2. Guard `startSession` with a connecting lock

Use a ref (`isConnectingRef`) to prevent overlapping calls. If a connection attempt is already in progress, ignore new requests.

### 3. Guard `endSession` -- never call during connecting

Only call `endSession()` when `conversation.status === 'connected'`. During connecting, just close the panel without trying to tear down a half-open session.

### 4. Stabilize all refs and callbacks

- Store `conversation` in a ref for keepalive (already done, keep it)
- Remove `conversation` and `status` from callback dependencies
- Keepalive depends only on `conversation.status` (SDK value), not our state

### 5. Keep the keepalive at 10s (already correct)

## File to Modify

**`src/components/crepes-demo/voice/AliciaVoicePanel.tsx`** -- single file, complete rewrite of state logic:

```text
Key changes:
- Remove: const [status, setStatus] = useState(...)
- Add: const [isConnecting, setIsConnecting] = useState(false)
- Use: conversation.status throughout ('connected' | 'disconnected')
- Add: isConnectingRef to prevent overlapping startSession calls
- Guard: endSession only when conversation.status === 'connected'
- Keepalive: depends on [conversation.status] not custom state
- Video: uses conversation.status + conversation.isSpeaking
```

## Expected Result

- No more "Session cancelled during connection" errors
- No reconnect loops -- session starts once, stays connected
- If a genuine network drop occurs, user sees "Reconectar" button (no auto-loop)
- Mute works natively via SDK
- Video pauses when listening, plays when ALICIA speaks

