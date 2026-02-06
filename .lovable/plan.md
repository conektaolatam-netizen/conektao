

## Boton de Conversacion con ALICIA (ElevenLabs Voice Agent)

### Que se va a construir

Un boton flotante en el dashboard de Crepes & Waffles que al hacer click abre un panel/rectangulo con:
- **Video de ALICIA** moviendo la boca cuando ella esta hablando
- **Imagen estatica de ALICIA** cuando esta en silencio/escuchando
- Conversacion de voz en tiempo real usando ElevenLabs Conversational AI (WebRTC)
- Boton para cerrar la conversacion

### Estado actual (ya listo)

- Edge function `elevenlabs-conversation-token` ya existe y funciona
- Secrets `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID` ya configurados
- Paquete `@elevenlabs/react` ya instalado

### Pendiente del usuario

Necesito que subas dos archivos:
1. **Video de ALICIA** hablando (moviendo la boca) - formato MP4 o WebM
2. **Imagen de ALICIA** en reposo (quieta) - formato PNG, JPG o WebP

### Arquitectura del componente

```text
BranchManagerDashboard
  |
  +-- [Boton flotante "Hablar con ALICIA"]  (esquina inferior derecha)
  |
  +-- AliciaVoicePanel (se abre al click)
       |
       +-- Video (cuando isSpeaking = true)
       +-- Imagen (cuando isSpeaking = false)
       +-- Indicador de estado (Conectando / Escuchando / Hablando)
       +-- Boton cerrar conversacion
```

### Flujo de interaccion

1. Usuario ve boton flotante con icono/avatar de ALICIA en esquina inferior derecha
2. Click en el boton: se abre un panel rectangular (aprox 400x500px)
3. Se solicita permiso de microfono
4. Se obtiene token via edge function `elevenlabs-conversation-token`
5. Se inicia sesion WebRTC con ElevenLabs
6. **Cuando ALICIA habla** (`isSpeaking = true`): se muestra el video en loop
7. **Cuando ALICIA escucha** (`isSpeaking = false`): se muestra la imagen estatica
8. Usuario puede cerrar el panel en cualquier momento (termina la sesion)

### Archivos a crear/modificar

1. **Crear `src/components/crepes-demo/voice/AliciaVoiceButton.tsx`**
   - Boton flotante con avatar mini de ALICIA
   - Usa estetica futurista (borde glow turquesa/naranja)
   - Al click abre el panel

2. **Crear `src/components/crepes-demo/voice/AliciaVoicePanel.tsx`**
   - Panel rectangular con fondo oscuro (`#1a1a2e`) consistente con las secciones IA
   - Usa `useConversation` de `@elevenlabs/react`
   - Alterna entre `<video>` y `<img>` segun `conversation.isSpeaking`
   - Indicador de estado con animaciones sutiles
   - Boton de cerrar/terminar

3. **Modificar `src/components/crepes-demo/BranchManagerDashboard.tsx`**
   - Agregar `AliciaVoiceButton` como componente flotante (fixed position)

### Seccion tecnica

**Logica principal del panel:**

```typescript
import { useConversation } from "@elevenlabs/react";

const conversation = useConversation({
  onConnect: () => setStatus('connected'),
  onDisconnect: () => setStatus('disconnected'),
  onError: (error) => toast.error("Error de conexion"),
});

// Alternar video/imagen
{conversation.isSpeaking ? (
  <video src={aliciaVideoUrl} autoPlay loop muted={false} />
) : (
  <img src={aliciaImageUrl} alt="ALICIA" />
)}
```

**Conexion con token:**

```typescript
const startConversation = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true });
  const { data } = await supabase.functions.invoke("elevenlabs-conversation-token");
  await conversation.startSession({
    conversationToken: data.token,
    connectionType: "webrtc",
  });
};
```

**Estetica del boton flotante:**
- Position fixed, bottom-6 right-6
- Circulo con avatar de ALICIA o icono de microfono
- Borde con gradiente turquesa/naranja (AIGlowBorder)
- Animacion de pulse sutil para indicar que esta disponible

