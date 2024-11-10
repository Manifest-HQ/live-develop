export function ALL(request) {
  return new Response(JSON.stringify({ message: 'Projects all' }))
}

export function GET(request) {
  return new Response(JSON.stringify({ message: 'Projects get' }))
}
