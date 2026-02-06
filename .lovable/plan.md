
# Fix ALICIA Connection Stability - Root Cause Analysis and Solution

## Root Cause

The frequent disconnections are caused by **two compounding bugs**:

1. **Unstable Effect Dependencies**: The keepalive `useEffect` depends on `[status, conversation]`. The `conversation` object returned by `useConversation` may create a new reference on re-renders, causing the effect to tear down and re-create the interval constantly -- effectively breaking the keepalive.

2. **Auto-restart Loop**: When ElevenLabs disconnects, `onDisconnect` sets `status = 'idle'`. Because `isOpen` is still `true`, the component shows the "Reconectar" button. Any interaction or re-render can trigger another connection attempt, creating a connect-disconnect-connect loop.

3. **Mute button does nothing**: The current mute toggle only changes a visual state variable but doesn't actually mute the microphone. The SDK has a built-in `micMuted` controlled state that should be used instead.

## Solution

### 1. Stabilize the keepalive with a ref

Store the conversation object in a ref so the keepalive interval is created once and never torn down until status truly changes.

```text
const conversationRef = useRef(conversation);
conversationRef.current = conversation;

// Keepalive depends ONLY on status, not conversation
useEffect(() => {
  if (status === 'connected') {
    keepaliveRef.current = setInterval(() => {
      try { conversationRef.current.sendUserActivity(); } catch {}
    }, 10000); // 10s is sufficient
  }
  return () => clearInterval(keepaliveRef.current);
}, [status]); // <-- no conversation dependency
```

### 2. Prevent auto-restart loop

Remove the auto-start effect entirely. Instead, call `startConversation()` only once when the panel first opens (via a `hasStartedRef`). If disconnected, show the reconnect button but never auto-restart.

### 3. Use SDK's built-in micMuted

Pass `micMuted` as a controlled prop to `useConversation` so the SDK handles actual audio muting:

```text
const conversation = useConversation({
  micMuted: isMicMuted,
  onConnect: () => { ... },
  ...
});
```

### 4. Remove noisy console logs

Remove the keepalive log that fires every 3 seconds, keeping only connect/disconnect logs.

### 5. Reduce keepalive frequency

Change from 3s to 10s. The current 3s interval is unnecessarily aggressive and generates noise. ElevenLabs WebRTC connections typically have a ~30s inactivity timeout.

## Files to Modify

- **`src/components/crepes-demo/voice/AliciaVoicePanel.tsx`** -- All changes are in this single file

## Expected Result

- ALICIA stays connected throughout the entire conversation without dropping
- If a rare network issue causes a disconnect, user sees a clean "Reconectar" button (no loop)
- Mute button actually mutes the microphone via the SDK
- No console spam from keepalive logs
