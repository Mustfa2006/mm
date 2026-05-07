export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/session=([^;]+)/)

  if (!match) {
    return Response.json({ error: 'غير مسجل دخول' }, { status: 401 })
  }

  try {
    const data = JSON.parse(decodeURIComponent(match[1]))
    return Response.json(data)
  } catch {
    return Response.json({ error: 'جلسة غير صالحة' }, { status: 401 })
  }
}
