function _404(request) {
  return new Response(JSON.stringify({ details: 'not found' }), { status: 404 })
}

export function GET(request) {
  return _404(request)
}

export function POST(request) {
  return _404(request)
}

export function PUT(request) {
  return _404(request)
}

export function DELETE(request) {
  return _404(request)
}

export function PATCH(request) {
  return _404(request)
}

export const config = {
  runtime: 'edge'
}
