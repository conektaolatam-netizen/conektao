

# Plan: Add Custom "Slot Full" Message to Reservation Config

## Problem

When a reservation slot is full, the backend correctly rejects it but sends a hardcoded generic message ("Lo siento, ese horario ya está completo"). The AI then sometimes adds confusing follow-up about pizzas or orders. The user wants a configurable message for this scenario.

## Changes

### 1. UI — `src/components/alicia-config/AliciaConfigReservations.tsx`

- Add `slot_full_message: string` to `ReservationConfig` interface (default: `"Lo siento, ese horario ya está completo. ¿Te gustaría reservar en otro horario?"`)
- Add a Textarea field in the UI between the confirmation message card and the agenda view, labeled "Mensaje cuando el horario está lleno"
- This field appears when `enabled = true`, alongside the existing confirmation message

### 2. Backend — `supabase/functions/whatsapp-webhook/index.ts`

**Change A** — In `checkSlotAvailability()` (~line 2124): instead of returning a hardcoded string, return a generic flag. The actual message is composed by the caller.

**Change B** — In `processReservation()` (~line 2320-2329): when slot is full, use `resConfig.slot_full_message` (falling back to a default) as the response sent to the customer. This ensures the backend sends the restaurant's custom message directly, not letting the AI improvise.

## What stays untouched

- Reservation flow detection, validation, ICS generation, email sending
- Order flow, all other webhook logic
- Database schema (no migration needed — `slot_full_message` is a new key inside the existing `reservation_config` JSONB field)

