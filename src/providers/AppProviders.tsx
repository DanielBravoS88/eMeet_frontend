'use client'

import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from '../context/AuthContext'
import { ChatProvider } from '../context/ChatContext'
import { LocatarioEventsProvider } from '../context/LocatarioEventsContext'
import OnboardingOverlay from '../components/OnboardingOverlay'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user": Framer Motion desactiva animaciones de transform/layout
    // cuando el sistema tiene activado "reducir movimiento" (accesibilidad)
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <LocatarioEventsProvider>
          <ChatProvider>
            {children}
            <OnboardingOverlay />
          </ChatProvider>
        </LocatarioEventsProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
