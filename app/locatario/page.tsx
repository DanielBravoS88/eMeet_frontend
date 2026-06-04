import { redirect } from 'next/navigation'

/**
 * Ruta legacy. Antes del refactor de roles, los locatarios accedían aquí.
 * Ahora /locatario redirige a /creator para no romper bookmarks viejos.
 *
 * Si en algún momento ya no hay tráfico a esta ruta, se puede eliminar
 * la carpeta junto con su entrada en el middleware.
 */
export default function LegacyLocatarioRedirect() {
  redirect('/creator')
}
