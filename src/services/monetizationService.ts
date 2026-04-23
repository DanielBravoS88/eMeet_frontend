import { getSupabaseAccessToken, requireSupabaseAccessToken } from '../lib/authSession'
import { hasSupabaseEnv } from '../lib/supabase'

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim().replace(/\/$/, '')

export type TokenPackCode = 'starter' | 'growth' | 'pro'
export type TokenPaymentProvider = 'mercadopago' | 'transbank_webpay'
export type PromotionType = 'featured' | 'geo_boost' | 'coupon' | 'premium_badge'

export interface TokenPack {
  code: TokenPackCode
  name: string
  tokens: number
  amountClp: number
}

export interface TokenWallet {
  id: string
  locatario_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface PaymentOrder {
  id: string
  provider: TokenPaymentProvider
  pack_code: TokenPackCode
  token_amount: number
  amount_clp: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'
  checkout_url: string | null
  checkout_token?: string | null
}

export interface PromotionCampaign {
  id: string
  event_id: string
  type: PromotionType
  status: 'active' | 'paused' | 'expired' | 'cancelled'
  token_cost: number
  starts_at: string
  ends_at: string
  created_at: string
}

export interface WalletResponse {
  wallet: TokenWallet | null
  campaigns: PromotionCampaign[]
}

export class MonetizationApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MonetizationApiError'
    this.status = status
  }
}

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('Falta NEXT_PUBLIC_BACKEND_URL para usar monetizacion.')
  }
  return BACKEND_URL
}

function buildJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return headers
}

async function monetizationFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = buildJsonHeaders(init?.headers)

  if (hasSupabaseEnv) {
    const accessToken = await getSupabaseAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${requireBackendUrl()}${input}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new MonetizationApiError(body?.error ?? 'No se pudo completar la operacion.', response.status)
  }

  return response.json() as Promise<T>
}

async function monetizationFetchWithAuth<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = buildJsonHeaders(init?.headers)
  const accessToken = await requireSupabaseAccessToken(
    'Tu sesion expiro o no esta activa. Inicia sesion nuevamente para usar monetizacion.',
  )

  headers.set('Authorization', `Bearer ${accessToken}`)

  return monetizationFetch<T>(input, { ...init, headers })
}

export function getTokenPacks() {
  return monetizationFetch<TokenPack[]>('/monetization/packs')
}

function emptyWalletResponse(): WalletResponse {
  return { wallet: null, campaigns: [] }
}

export async function getWallet() {
  try {
    const response = await monetizationFetchWithAuth<WalletResponse>('/monetization/wallet')
    return {
      wallet: response.wallet ?? null,
      campaigns: response.campaigns ?? [],
    }
  } catch (err) {
    if (err instanceof MonetizationApiError && err.status === 404) {
      return emptyWalletResponse()
    }
    throw err
  }
}

type RawPaymentOrder = PaymentOrder & {
  checkoutUrl?: string | null
  checkoutURL?: string | null
  payment_url?: string | null
  redirect_url?: string | null
  init_point?: string | null
  sandbox_init_point?: string | null
  url?: string | null
  token?: string | null
  token_ws?: string | null
}

function normalizePaymentOrder(order: RawPaymentOrder): PaymentOrder {
  return {
    ...order,
    checkout_url:
      order.checkout_url ??
      order.checkoutUrl ??
      order.checkoutURL ??
      order.payment_url ??
      order.redirect_url ??
      order.init_point ??
      order.sandbox_init_point ??
      order.url ??
      null,
    checkout_token: order.checkout_token ?? order.token_ws ?? order.token ?? null,
  }
}

export async function createTokenPurchase(packCode: TokenPackCode, provider: TokenPaymentProvider) {
  const order = await monetizationFetchWithAuth<RawPaymentOrder>('/monetization/purchases', {
    method: 'POST',
    body: JSON.stringify({ packCode, provider }),
  })
  return normalizePaymentOrder(order)
}

export function activatePromotion(eventId: string, type: PromotionType, durationDays = 1) {
  return monetizationFetchWithAuth<{ campaign: PromotionCampaign; wallet: TokenWallet }>('/monetization/promotions', {
    method: 'POST',
    body: JSON.stringify({ eventId, type, durationDays }),
  })
}

export function confirmTransbankPayment(orderId: string, tokenWs: string) {
  return monetizationFetchWithAuth<PaymentOrder>('/monetization/transbank/commit', {
    method: 'POST',
    body: JSON.stringify({ orderId, tokenWs }),
  })
}

export function confirmMercadoPagoPayment(orderId: string, paymentId?: string) {
  return monetizationFetchWithAuth<PaymentOrder>('/monetization/mercadopago/confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId, ...(paymentId ? { paymentId } : {}) }),
  })
}
