import Layout from '../../src/components/Layout'

export default function CouponsPage() {
  return (
    <Layout headerTitle="Cupones">
      <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <span className="text-6xl">🎟️</span>
        <h2 className="text-2xl font-bold text-white">Cupones y promociones</h2>
        <p className="text-sm leading-6 text-muted">
          Pronto encontrarás aquí descuentos exclusivos en bares, restaurantes y eventos cercanos a ti.
        </p>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary-light">
          Próximamente
        </span>
      </div>
    </Layout>
  )
}
