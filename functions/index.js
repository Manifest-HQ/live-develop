export function GET(request) {
  return new Response(
    `Hello from ${process.env.VERCEL_REGION} EdgeRuntime ${EdgeRuntime}`
  )
}

export const config = {
  runtime: 'edge'
}
