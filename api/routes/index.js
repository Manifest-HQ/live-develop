export function ALL(request) {
  console.log('ALL')
  return new Response(JSON.stringify({ message: 'Hello, World!' }))
}
