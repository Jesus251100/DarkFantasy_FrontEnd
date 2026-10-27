/** Solo deja volver a una ruta de este juego, nunca a una dirección externa. */
export function destinoTrasLogin(valor: unknown): string {
  const texto = String(valor ?? '')
  if (texto.startsWith('/') && !texto.startsWith('//')) return texto
  return '/lobby'
}
