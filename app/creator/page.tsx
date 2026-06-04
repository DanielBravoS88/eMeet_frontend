'use client'

import { useAuth } from '@/src/context/AuthContext'
import { useLocatarioEvents } from '@/src/context/LocatarioEventsContext'
import { hasSupabaseEnv } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiPlus, FiBarChart2, FiCalendar, FiAlertCircle, FiLoader, FiTrash2, FiHome, FiMapPin, FiX, FiInfo, FiImage, FiTag } from 'react-icons/fi'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { EventCategory } from '@/src/types'
import { ImageUpload } from '@/src/components/ImageUpload'
import { VideoUpload } from '@/src/components/VideoUpload'
import { DateTimePicker } from '@/src/components/DateTimePicker'
import { DeezerSearch } from '@/src/components/DeezerSearch'
import dynamic from 'next/dynamic'
const LocationPickerMap = dynamic(
  () => import('@/src/components/LocationPickerMap').then(m => m.LocationPickerMap),
  { ssr: false }
)
import {
  activatePromotion,
  confirmMercadoPagoPayment,
  confirmTransbankPayment,
  createCouponCampaign,
  createTokenPurchase,
  getCoupons,
  getTokenPacks,
  getWallet,
  validateCouponQr,
  type CouponWithRelations,
  type PromotionCampaign,
  type TokenPack,
  type TokenPaymentProvider,
  type TokenWallet,
} from '@/src/services/monetizationService'

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  price: '',
  address: '',
  imageUrl: '',
  videoUrl: '',
  mediaType: 'image' as 'image' | 'video',
  category: 'fiesta' as EventCategory,
}

const COUPON_COST_PER_DAY = 25

/** Bloque de sección del formulario de crear evento: cabecera con ícono + campos. */
function FormSection({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-light">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-white">{title}</h3>
          {hint && <p className="text-[11px] leading-tight text-muted">{hint}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

/** Label persistente para los campos del formulario. */
function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-violet-200/70">
      {children}
      {required && <span className="text-primary-light"> *</span>}
    </label>
  )
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function buildQrImageUrl(qrToken: string) {
  const params = new URLSearchParams({
    size: '180x180',
    data: qrToken,
  })

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
}

export default function LocatarioPage() {
  const { user, logout, isAuthReady, accessToken } = useAuth()
  const { createLocatarioEvent, locatarioEvents, removeLocatarioEvent, isLoading } = useLocatarioEvents()
  const router = useRouter()

  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [wallet, setWallet] = useState<TokenWallet | null>(null)
  const [tokenPacks, setTokenPacks] = useState<TokenPack[]>([])
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([])
  const [coupons, setCoupons] = useState<CouponWithRelations[]>([])
  const [monetizationLoading, setMonetizationLoading] = useState(false)
  const [monetizationAction, setMonetizationAction] = useState<string | null>(null)
  const [packsError, setPacksError] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponEventId, setCouponEventId] = useState('')
  const [couponDurationDays, setCouponDurationDays] = useState('7')
  const [qrValidationToken, setQrValidationToken] = useState('')
  const [qrValidationResult, setQrValidationResult] = useState<string | null>(null)
  const [visibleCouponQrId, setVisibleCouponQrId] = useState<string | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [audioTrackLabel, setAudioTrackLabel] = useState<string | null>(null)
  const [audioTrackId, setAudioTrackId] = useState<string | null>(null)
  const [eventForm, setEventForm] = useState({
    ...EMPTY_FORM,
    address: user?.businessLocation ?? user?.location ?? '',
  })
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpiar feedback automáticamente después de 4s
  useEffect(() => {
    if (!feedback) return
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000)
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [feedback])

  const loadMonetization = async () => {
    setMonetizationLoading(true)
    setPacksError(null)
    setWalletError(null)
    setCouponError(null)
    try {
      const packs = await getTokenPacks()
      setTokenPacks(packs)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los packs de tokens.'
      setTokenPacks([])
      setPacksError(message)
    }

    try {
      const walletResponse = await getWallet()
      setWallet(walletResponse.wallet)
      setCampaigns(walletResponse.campaigns)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo cargar la monetizacion.'
      setWallet(null)
      setCampaigns([])
      setWalletError(message)
    }

    try {
      const couponsResponse = await getCoupons()
      setCoupons(couponsResponse.coupons)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los cupones.'
      setCoupons([])
      setCouponError(message)
    } finally {
      setMonetizationLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthReady || !user || !user.isEventCreator || (hasSupabaseEnv && !accessToken)) return
    loadMonetization()
  }, [isAuthReady, user?.id, user?.isEventCreator, accessToken])

  useEffect(() => {
    if (!isAuthReady || !user || !user.isEventCreator || (hasSupabaseEnv && !accessToken) || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const orderId = params.get('order') ?? params.get('external_reference')
    const tokenWs = params.get('token_ws')
    const mercadoPagoPaymentId = params.get('payment_id') ?? params.get('collection_id')

    if (!payment) return

    if (payment === 'transbank_failed' || payment === 'failure') {
      setFeedback({ message: 'El pago no fue aprobado. No se acreditaron tokens.', type: 'error' })
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (payment === 'pending') {
      setFeedback({ message: 'El pago quedo pendiente de confirmacion.', type: 'error' })
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (!orderId) return

    ;(async () => {
      try {
        if (payment === 'transbank' && tokenWs) {
          await confirmTransbankPayment(orderId, tokenWs)
          setFeedback({ message: 'Pago confirmado. Tokens acreditados en tu saldo.', type: 'success' })
        } else if (payment === 'transbank_success') {
          setFeedback({ message: 'Pago confirmado. Tokens acreditados en tu saldo.', type: 'success' })
        } else if (payment === 'success') {
          await confirmMercadoPagoPayment(orderId, mercadoPagoPaymentId ?? undefined)
          setFeedback({ message: 'Pago confirmado. Tokens acreditados en tu saldo.', type: 'success' })
        }
        await loadMonetization()
        window.history.replaceState({}, '', window.location.pathname)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo confirmar el pago.'
        setFeedback({ message, type: 'error' })
      }
    })()
  }, [isAuthReady, user?.id, user?.role, accessToken])

  useEffect(() => {
    if (couponEventId || locatarioEvents.length === 0) return
    setCouponEventId(locatarioEvents[0].id)
  }, [couponEventId, locatarioEvents])

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  const handleSubmitEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.date) {
      setFeedback({ message: 'Completa al menos título, descripción y fecha.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await createLocatarioEvent({
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        date: eventForm.date,
        address: eventForm.address || user?.businessLocation || user?.location || 'Santiago, Chile',
        price: eventForm.price.trim() === '' ? null : Number(eventForm.price),
        imageUrl: eventForm.mediaType === 'image' ? eventForm.imageUrl : undefined,
        videoUrl: eventForm.mediaType === 'video' ? eventForm.videoUrl : undefined,
        audioPreviewUrl: audioPreviewUrl ?? null,
        audioTrackId: audioTrackId ?? null,
        organizerName: user?.businessName || user?.name || '',
        organizerAvatar: user?.avatarUrl || 'https://i.pravatar.cc/150?img=32',
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
      })

      setEventForm({ ...EMPTY_FORM, address: user?.businessLocation ?? user?.location ?? '' })
      setGpsCoords(null)
      setAudioPreviewUrl(null)
      setAudioTrackLabel(null)
      setAudioTrackId(null)
      setShowCreateEvent(false)
      setFeedback({
        message: 'Evento publicado correctamente. Si tiene ubicación GPS, quedará visible en el feed público.',
        type: 'success',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el evento.'
      setFeedback({ message, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleDelete = async (eventId: string) => {
    setDeletingId(eventId)
    try {
      await removeLocatarioEvent(eventId)
    } catch {
      setFeedback({ message: 'No se pudo eliminar el evento.', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const redirectToCheckout = (checkoutUrl: string, checkoutToken?: string | null) => {
    if (!checkoutToken) {
      window.location.href = checkoutUrl
      return
    }

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = checkoutUrl
    form.style.display = 'none'

    const tokenInput = document.createElement('input')
    tokenInput.type = 'hidden'
    tokenInput.name = 'token_ws'
    tokenInput.value = checkoutToken
    form.appendChild(tokenInput)

    document.body.appendChild(form)
    form.submit()
  }

  const handleBuyTokens = async (packCode: TokenPack['code'], provider: TokenPaymentProvider) => {
    setMonetizationAction(`${packCode}-${provider}`)
    try {
      const order = await createTokenPurchase(packCode, provider)
      if (order.checkout_url) {
        redirectToCheckout(order.checkout_url, provider === 'transbank_webpay' ? order.checkout_token : null)
        return
      }
      setFeedback({ message: 'Orden creada, pero el proveedor no devolvio una URL de pago.', type: 'error' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar la compra de tokens.'
      setFeedback({ message, type: 'error' })
    } finally {
      setMonetizationAction(null)
    }
  }

  const handlePromoteEvent = async (eventId: string) => {
    setMonetizationAction(`promote-${eventId}`)
    try {
      const result = await activatePromotion(eventId, 'featured', 1)
      setWallet(result.wallet)
      setCampaigns((prev) => [result.campaign, ...prev])
      setFeedback({ message: 'Evento destacado por 24 horas.', type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo activar la promocion.'
      setFeedback({ message, type: 'error' })
    } finally {
      setMonetizationAction(null)
    }
  }

  const handleCreateCoupon = async () => {
    if (!couponEventId) {
      setFeedback({ message: 'Selecciona un evento para crear el cupón.', type: 'error' })
      return
    }

    setMonetizationAction('create-coupon')
    try {
      const result = await createCouponCampaign(couponEventId, Number(couponDurationDays))
      setWallet(result.wallet)
      setCampaigns((prev) => [result.campaign, ...prev])
      await loadMonetization()
      setQrValidationResult(`Cupón creado para ${result.event.title}.`)
      setFeedback({ message: 'Cupón creado y guardado en la base real.', type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el cupón.'
      setFeedback({ message, type: 'error' })
    } finally {
      setMonetizationAction(null)
    }
  }

  const handleValidateCouponQr = async () => {
    if (!qrValidationToken.trim()) {
      setFeedback({ message: 'Ingresa un token QR para validar.', type: 'error' })
      return
    }

    setMonetizationAction('validate-coupon')
    try {
      const result = await validateCouponQr(qrValidationToken.trim())
      setQrValidationResult(
        result.event?.title
          ? `Cupón validado para ${result.event.title} con estado ${result.coupon.status}.`
          : `Cupón validado con estado ${result.coupon.status}.`,
      )
      setQrValidationToken('')
      await loadMonetization()
      setFeedback({ message: 'QR validado correctamente.', type: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo validar el QR.'
      setQrValidationResult(null)
      setFeedback({ message, type: 'error' })
    } finally {
      setMonetizationAction(null)
    }
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <FiLoader className="animate-spin text-accent" size={28} />
      </div>
    )
  }

  if (!user || !user.isEventCreator || (hasSupabaseEnv && !accessToken)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Modo creador no activado</h1>
          <p className="text-muted mb-6">Activa el modo creador desde tu perfil para gestionar eventos.</p>
          <button
            onClick={() => router.push('/profile?activate-creator=1')}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg"
          >
            Activar modo creador
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card border-b border-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white sm:text-2xl truncate">Panel de Locatario</h1>
            <p className="text-xs text-muted sm:text-sm truncate">{user.businessName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
              title="Ver feed"
            >
              <FiHome size={18} />
              <span className="hidden sm:inline text-sm">Ver feed</span>
            </button>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <FiPlus size={18} />
              <span className="hidden sm:inline text-sm">Crear Evento</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <FiLogOut size={18} />
              <span className="hidden sm:inline text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
        {/* Bienvenida */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-bold text-white mb-1 sm:text-3xl sm:mb-2">Bienvenido, {user.name}</h2>
          <p className="text-sm text-muted sm:text-base">Gestiona tus eventos y promociones en {user.businessName}</p>
        </div>

        {/* Feedback global */}
        {feedback && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm transition-all flex items-center justify-between gap-4 ${
              feedback.type === 'success'
                ? 'border-green-500/20 bg-green-500/10 text-green-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            <span>{feedback.message}</span>
            {feedback.type === 'success' && (
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1 font-semibold underline underline-offset-2 whitespace-nowrap hover:opacity-80"
              >
                <FiHome size={14} />
                Ir al feed
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {(() => {
          const withGps = locatarioEvents.filter((e) => e.lat != null && e.lng != null).length
          const free = locatarioEvents.filter((e) => e.price === null).length
          const paid = locatarioEvents.filter((e) => e.price !== null)
          const avgPrice = paid.length > 0
            ? Math.round(paid.reduce((sum, e) => sum + (e.price ?? 0), 0) / paid.length)
            : null

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-card rounded-lg p-4">
                <p className="text-muted text-sm mb-2">Eventos Activos</p>
                <div className="text-3xl font-bold text-accent">
                  {isLoading ? <FiLoader className="animate-spin" size={28} /> : locatarioEvents.length}
                </div>
                <p className="text-xs text-muted mt-2">Publicados desde tu panel</p>
              </div>
              <div className="bg-card border border-card rounded-lg p-4">
                <p className="text-muted text-sm mb-2">Con Ubicación GPS</p>
                <div className="text-3xl font-bold text-primary">
                  {isLoading ? <FiLoader className="animate-spin" size={28} /> : withGps}
                </div>
                <p className="text-xs text-muted mt-2">Aparecen en el mapa del feed</p>
              </div>
              <div className="bg-card border border-card rounded-lg p-4">
                <p className="text-muted text-sm mb-2">Eventos Gratuitos</p>
                <div className="text-3xl font-bold text-green-400">
                  {isLoading ? <FiLoader className="animate-spin" size={28} /> : free}
                </div>
                <p className="text-xs text-muted mt-2">Sin costo de entrada</p>
              </div>
              <div className="bg-card border border-card rounded-lg p-4">
                <p className="text-muted text-sm mb-2">Precio Promedio</p>
                <div className="text-3xl font-bold text-orange-400">
                  {isLoading
                    ? <FiLoader className="animate-spin" size={28} />
                    : avgPrice != null
                      ? `$${avgPrice.toLocaleString('es-CL')}`
                      : '—'}
                </div>
                <p className="text-xs text-muted mt-2">
                  {paid.length > 0 ? `${paid.length} eventos de pago` : 'Sin eventos de pago'}
                </p>
              </div>
            </div>
          )
        })()}

        {/* Monetizacion por tokens */}
        <section className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-6 mb-8">
          <div className="bg-card border border-card rounded-lg p-6">
            <p className="text-sm text-muted">Saldo promocional</p>
            <div className="mt-2 text-4xl font-bold text-primary-light">
              {monetizationLoading ? <FiLoader className="animate-spin" size={32} /> : `${wallet?.balance ?? 0} tokens`}
            </div>
            <p className="mt-3 text-sm text-muted">
              Usa tokens para destacar eventos, ampliar alcance y activar promociones con cupones QR.
            </p>
            <p className="mt-3 text-sm text-green-400">
              {campaigns.filter((campaign) => campaign.status === 'active').length} promociones activas
            </p>
            {walletError && (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {walletError}
              </p>
            )}
          </div>

          <div className="bg-card border border-card rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Comprar tokens</h3>
                <p className="text-sm text-muted">Paga de forma segura con Mercado Pago o Transbank Webpay Plus.</p>
              </div>
              {monetizationLoading && <FiLoader className="animate-spin text-accent" size={20} />}
            </div>

            {packsError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-5 text-sm text-red-300">
                {packsError}
              </div>
            )}

            {!monetizationLoading && !packsError && tokenPacks.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-surface/60 px-4 py-5 text-sm text-muted">
                No hay packs de tokens configurados por el momento.
              </div>
            )}

            {tokenPacks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tokenPacks.map((pack) => (
                  <article key={pack.code} className="rounded-lg border border-white/10 bg-surface/60 p-4">
                    <h4 className="text-sm font-semibold text-white">{pack.name}</h4>
                    <p className="mt-2 text-2xl font-bold text-accent">{pack.tokens} tokens</p>
                    <p className="text-xs text-muted">{formatCLP(pack.amountClp)}</p>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleBuyTokens(pack.code, 'transbank_webpay')}
                        disabled={monetizationAction === `${pack.code}-transbank_webpay`}
                        className="rounded-lg bg-primary hover:bg-primary-dark px-3 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                      >
                        Webpay Plus
                      </button>
                      <button
                        onClick={() => handleBuyTokens(pack.code, 'mercadopago')}
                        disabled={monetizationAction === `${pack.code}-mercadopago`}
                        className="rounded-lg bg-silver hover:bg-primary-light px-3 py-2 text-sm font-semibold text-surface transition-colors disabled:opacity-60"
                      >
                        Mercado Pago
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tabla/Cards de eventos */}
        <div className="bg-card border border-card rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-4 border-b border-card flex items-center justify-between gap-2 sm:px-6">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-accent" size={20} />
              <h3 className="text-lg font-semibold text-white">Tus Eventos</h3>
            </div>
            <span className="text-xs text-muted">{locatarioEvents.length} eventos</span>
          </div>

          {/* Estado vacío / cargando */}
          {(isLoading || locatarioEvents.length === 0) && (
            <div className="px-6 py-10 text-center text-sm text-muted">
              {isLoading
                ? <><FiLoader className="animate-spin inline mr-2" size={16} />Cargando eventos...</>
                : 'Aún no tienes eventos creados. Crea uno y aparecerá en el feed principal.'}
            </div>
          )}

          {/* Cards — móvil (sm y menor) */}
          {!isLoading && locatarioEvents.length > 0 && (
            <div className="divide-y divide-card/50 sm:hidden">
              {locatarioEvents.map((event) => (
                <div key={event.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white leading-snug">{event.title}</p>
                    {event.lat != null && event.lng != null && (
                      <span className="flex items-center gap-1 text-[11px] text-green-400 shrink-0">
                        <FiMapPin size={11} /> GPS
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{new Date(event.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {event.price == null
                      ? <span className="text-green-400 font-semibold">Gratis</span>
                      : <span className="text-primary-light font-semibold">${event.price.toLocaleString('es-CL')}</span>}
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handlePromoteEvent(event.id)}
                      disabled={monetizationAction === `promote-${event.id}`}
                      className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                    >
                      {monetizationAction === `promote-${event.id}` ? 'Destacando...' : '⭐ Destacar'}
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {deletingId === event.id ? <FiLoader className="animate-spin" size={12} /> : <FiTrash2 size={12} />}
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabla — desktop (sm+) */}
          {!isLoading && locatarioEvents.length > 0 && (
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr className="border-b border-card">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted">Evento</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted">Fecha</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted">Precio</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted">GPS</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {locatarioEvents.map((event) => (
                    <tr key={event.id} className="border-b border-card/50 hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{event.title}</td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {new Date(event.date).toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {event.price == null
                          ? <span className="text-green-400">Gratis</span>
                          : <span className="text-primary-light">${event.price.toLocaleString('es-CL')}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {event.lat != null && event.lng != null
                          ? <span className="flex items-center gap-1 text-green-400"><FiMapPin size={13} /> Sí</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handlePromoteEvent(event.id)}
                            disabled={monetizationAction === `promote-${event.id}`}
                            className="text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
                          >
                            {monetizationAction === `promote-${event.id}` ? 'Destacando...' : 'Destacar'}
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {deletingId === event.id
                              ? <FiLoader className="animate-spin" size={14} />
                              : <FiTrash2 size={14} />}
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cupones + Analytics */}
        {(() => {
          const total = locatarioEvents.length
          const withGps = locatarioEvents.filter((e) => e.lat != null && e.lng != null).length
          const free = locatarioEvents.filter((e) => e.price === null).length
          const paid = total - free
          const gpsPercent = total > 0 ? Math.round((withGps / total) * 100) : 0
          const freePercent = total > 0 ? Math.round((free / total) * 100) : 0
          const couponCampaigns = campaigns.filter((campaign) => campaign.type === 'coupon')
          const activeCouponCampaigns = couponCampaigns.filter((campaign) => campaign.status === 'active').length
          const latestCouponCampaign = couponCampaigns[0] ?? null

          const categoryCount = locatarioEvents.reduce<Record<string, number>>((acc, e) => {
            acc[e.category] = (acc[e.category] ?? 0) + 1
            return acc
          }, {})
          const topCategories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cupones funcionales */}
              <div className="bg-card border border-card rounded-lg p-6 min-h-[200px]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Cupones de Descuento</h3>
                    <p className="text-sm text-muted">
                      Crea campañas coupon reales para tus eventos y valida beneficios QR desde el panel.
                    </p>
                  </div>
                  <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary-light whitespace-nowrap">
                    {activeCouponCampaigns} activas
                  </span>
                </div>

                <div className="space-y-4">
                  {walletError && (
                    <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {walletError}
                    </p>
                  )}
                  {couponError && (
                    <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                      {couponError}
                    </p>
                  )}
                  {!walletError && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Evento</span>
                        <select
                          value={couponEventId}
                          onChange={(e) => setCouponEventId(e.target.value)}
                          className="w-full rounded-lg border border-card bg-surface px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        >
                          <option value="">Selecciona un evento</option>
                          {locatarioEvents.map((event) => (
                            <option key={event.id} value={event.id}>
                              {event.title}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Duración</span>
                        <select
                          value={couponDurationDays}
                          onChange={(e) => setCouponDurationDays(e.target.value)}
                          className="w-full rounded-lg border border-card bg-surface px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        >
                          <option value="1">1 día</option>
                          <option value="7">7 días</option>
                          <option value="15">15 días</option>
                          <option value="30">30 días</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {!walletError && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted">
                        Costo real de activación: {Number(couponDurationDays) * COUPON_COST_PER_DAY} tokens.
                      </p>
                      <button
                        onClick={handleCreateCoupon}
                        disabled={monetizationAction === 'create-coupon' || !couponEventId || locatarioEvents.length === 0}
                        className="rounded-lg bg-primary hover:bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                      >
                        {monetizationAction === 'create-coupon' ? 'Creando...' : 'Crear cupón'}
                      </button>
                    </div>
                  )}

                    <div className="rounded-lg border border-white/10 bg-surface/50 p-4">
                      <div className="flex flex-col md:flex-row gap-3">
                        <input
                          value={qrValidationToken}
                          onChange={(e) => setQrValidationToken(e.target.value)}
                          placeholder="Pega un token QR para validar"
                          className="flex-1 rounded-lg border border-card bg-card px-3 py-2 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
                        />
                        <button
                          onClick={handleValidateCouponQr}
                          disabled={monetizationAction === 'validate-coupon'}
                          className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                        >
                          {monetizationAction === 'validate-coupon' ? 'Validando...' : 'Validar QR'}
                        </button>
                      </div>
                      {qrValidationResult && (
                        <p className="mt-3 text-xs text-green-400">{qrValidationResult}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Cupones creados</p>
                        {latestCouponCampaign && (
                          <p className="text-xs text-muted">
                            Última campaña: {formatDateLabel(latestCouponCampaign.created_at)}
                          </p>
                        )}
                      </div>

                      {monetizationLoading ? (
                        <div className="rounded-lg border border-white/10 bg-surface/50 px-4 py-5 text-sm text-muted">
                          <FiLoader className="animate-spin inline mr-2" size={14} />
                          Cargando cupones...
                        </div>
                      ) : coupons.length === 0 ? (
                        <div className="rounded-lg border border-white/10 bg-surface/50 px-4 py-5 text-sm text-muted">
                          Aún no tienes cupones creados. Selecciona un evento y activa tu primer cupón.
                        </div>
                      ) : (
                        <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                          {coupons.map((coupon) => (
                            <article key={coupon.id} className="rounded-lg border border-white/10 bg-surface/50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{coupon.title}</h4>
                                  <p className="text-xs text-muted">
                                    {coupon.event?.title ?? 'Evento asociado'}{coupon.event?.event_date ? ` · ${formatDateLabel(coupon.event.event_date)}` : ''}
                                  </p>
                                </div>
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-light">
                                  {coupon.status}
                                </span>
                              </div>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted">
                                <p>Campaña: {coupon.campaign?.status ?? 'sin estado'}</p>
                                <p>Vence: {coupon.expires_at ? formatDateLabel(coupon.expires_at) : 'sin fecha'}</p>
                              </div>
                              <p className="mt-3 rounded-lg border border-white/10 bg-card px-3 py-2 font-mono text-[11px] text-primary-light break-all">
                                {coupon.qr_token}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-muted">
                                  Muestra este QR o comparte el token para validar el cupón.
                                </p>
                                <button
                                  onClick={() => setVisibleCouponQrId((current) => current === coupon.id ? null : coupon.id)}
                                  className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold text-white transition-colors"
                                >
                                  {visibleCouponQrId === coupon.id ? 'Ocultar QR' : 'Ver QR'}
                                </button>
                              </div>
                              {visibleCouponQrId === coupon.id && (
                                <div className="mt-3 rounded-lg border border-white/10 bg-card px-4 py-4 flex flex-col items-center gap-3">
                                  <img
                                    src={buildQrImageUrl(coupon.qr_token)}
                                    alt={`QR del cupón ${coupon.title}`}
                                    width={180}
                                    height={180}
                                    className="h-[180px] w-[180px] rounded-lg bg-white p-2"
                                  />
                                  <p className="text-center text-xs text-muted">
                                    El usuario puede abrir este QR desde el panel y mostrarlo directamente al momento de validarlo.
                                  </p>
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              </div>

              {/* Analítica real derivada de los eventos */}
              <div className="bg-card border border-card rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiBarChart2 className="text-accent" size={20} />
                  <h3 className="text-lg font-semibold text-white">Resumen de Eventos</h3>
                </div>

                {total === 0 ? (
                  <p className="text-sm text-muted">Crea tu primer evento para ver estadísticas aquí.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted">Con ubicación GPS</span>
                        <span className="text-sm font-bold text-primary-light">{withGps} / {total}</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${gpsPercent}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted">Eventos gratuitos</span>
                        <span className="text-sm font-bold text-green-400">{free} gratis · {paid} de pago</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${freePercent}%` }} />
                      </div>
                    </div>

                    {topCategories.length > 0 && (
                      <div>
                        <p className="text-sm text-muted mb-2">Categorías más usadas</p>
                        <div className="flex flex-wrap gap-2">
                          {topCategories.map(([cat, count]) => (
                            <span
                              key={cat}
                              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-light"
                            >
                              {cat} · {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </main>

      {/* FAB móvil — botón flotante Crear Evento */}
      {!showCreateEvent && (
        <button
          onClick={() => setShowCreateEvent(true)}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105 active:scale-95 sm:hidden"
        >
          <FiPlus size={20} />
          Crear Evento
        </button>
      )}

      {/* Modal crear evento */}
      {showCreateEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateEvent(false) }}
        >
          <div
            className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card sm:rounded-2xl"
            style={{ maxHeight: '92dvh', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle (solo móvil) */}
            <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

            <div className="px-5 pt-4 sm:px-8 sm:pt-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">Crear nuevo evento</h2>
                  <p className="mt-0.5 text-xs text-muted">Completa los datos y publícalo en el feed</p>
                </div>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-white"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* ── Información básica ─────────────────────────────── */}
                <FormSection icon={<FiInfo size={16} />} title="Información básica" hint="Lo esencial de tu evento">
                  <div>
                    <FieldLabel required>Nombre del evento</FieldLabel>
                    <input
                      type="text"
                      placeholder="Ej. Noche de jazz en el rooftop"
                      value={eventForm.title}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-lg border border-card bg-surface px-4 py-3 text-white placeholder-muted outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <FieldLabel required>Descripción</FieldLabel>
                    <textarea
                      placeholder="Cuenta de qué trata y qué van a vivir los asistentes…"
                      rows={3}
                      value={eventForm.description}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full resize-none rounded-lg border border-card bg-surface px-4 py-3 text-white placeholder-muted outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <FieldLabel>Categoría</FieldLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        [
                          { value: 'fiesta', label: '🎉 Fiesta' },
                          { value: 'musica', label: '🎵 Música' },
                          { value: 'gastronomia', label: '🍽️ Gastro' },
                          { value: 'networking', label: '🤝 Network' },
                          { value: 'arte', label: '🎨 Arte' },
                          { value: 'cultura', label: '🏛️ Cultura' },
                          { value: 'teatro', label: '🎭 Teatro' },
                          { value: 'deporte', label: '⚽ Deporte' },
                        ] as { value: EventCategory; label: string }[]
                      ).map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setEventForm((prev) => ({ ...prev, category: cat.value }))}
                          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                            eventForm.category === cat.value
                              ? 'bg-primary text-white'
                              : 'bg-surface text-muted hover:text-white border border-card'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </FormSection>

                {/* ── Cuándo y dónde ─────────────────────────────────── */}
                <FormSection icon={<FiMapPin size={16} />} title="Cuándo y dónde" hint="Fecha, hora y ubicación del evento">
                  <div>
                    <FieldLabel required>Fecha y hora</FieldLabel>
                    <DateTimePicker
                      value={eventForm.date}
                      onChange={(val) => setEventForm((prev) => ({ ...prev, date: val }))}
                    />
                  </div>
                  <div>
                    <FieldLabel>Ubicación</FieldLabel>
                    <div className="space-y-2">
                      <LocationPickerMap
                        value={gpsCoords}
                        onLocationChange={(coords, address) => {
                          setGpsCoords(coords)
                          setEventForm((prev) => ({ ...prev, address }))
                        }}
                      />
                      {gpsCoords && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <FiMapPin size={12} />
                          <span className="truncate">
                            {eventForm.address || `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}`}
                          </span>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Dirección (se auto-completa al fijar en el mapa)"
                        value={eventForm.address}
                        onChange={(e) => {
                          setEventForm((prev) => ({ ...prev, address: e.target.value }))
                          setGpsCoords(null)
                        }}
                        className="w-full rounded-lg border border-card bg-surface px-4 py-2.5 text-sm text-white placeholder-muted outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* ── Multimedia ─────────────────────────────────────── */}
                <FormSection icon={<FiImage size={16} />} title="Multimedia" hint="Portada y música de fondo (opcional)">
                  <div>
                    <FieldLabel>Portada</FieldLabel>
                    <div className="overflow-hidden rounded-lg border border-card flex">
                      <button
                        type="button"
                        onClick={() => setEventForm((prev) => ({ ...prev, mediaType: 'image', videoUrl: '' }))}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                          eventForm.mediaType === 'image'
                            ? 'bg-primary text-white'
                            : 'bg-surface text-muted hover:text-white'
                        }`}
                      >
                        Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventForm((prev) => ({ ...prev, mediaType: 'video', imageUrl: '' }))}
                        className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                          eventForm.mediaType === 'video'
                            ? 'bg-primary text-white'
                            : 'bg-surface text-muted hover:text-white'
                        }`}
                      >
                        Video (15-20 s)
                      </button>
                    </div>
                    <div className="mt-2">
                      {eventForm.mediaType === 'image' ? (
                        <ImageUpload
                          bucket="event-images"
                          folder="events"
                          value={eventForm.imageUrl}
                          onChange={(url) => setEventForm((prev) => ({ ...prev, imageUrl: url }))}
                          placeholder="Subir imagen del evento"
                          aspectRatio="video"
                        />
                      ) : (
                        <VideoUpload
                          bucket="event-videos"
                          folder="events"
                          value={eventForm.videoUrl}
                          onChange={(url) => setEventForm((prev) => ({ ...prev, videoUrl: url }))}
                        />
                      )}
                    </div>
                  </div>

                  <DeezerSearch
                    value={audioPreviewUrl}
                    trackLabel={audioTrackLabel}
                    onChange={(url, label, trackId) => {
                      setAudioPreviewUrl(url)
                      setAudioTrackLabel(label)
                      setAudioTrackId(trackId)
                    }}
                  />
                </FormSection>

                {/* ── Precio ─────────────────────────────────────────── */}
                <FormSection icon={<FiTag size={16} />} title="Precio" hint="Déjalo vacío si la entrada es gratis">
                  <div>
                    <FieldLabel>Valor de entrada</FieldLabel>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                      <input
                        type="number"
                        placeholder="0 = gratis"
                        value={eventForm.price}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full rounded-lg border border-card bg-surface py-3 pl-8 pr-4 text-white placeholder-muted outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  </div>
                </FormSection>
              </div>

              <div className="mt-6 mb-2 flex gap-3">
                <button
                  onClick={() => setShowCreateEvent(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border border-white/15 bg-surface py-2.5 text-white transition-colors hover:bg-surface/80 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitEvent}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2.5 font-semibold text-white transition-colors hover:bg-accent/80 disabled:opacity-60"
                >
                  {isSubmitting && <FiLoader className="animate-spin" size={16} />}
                  {isSubmitting ? 'Creando...' : 'Publicar evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
