export async function POST() {
  const res = Response.json({ success: true })
  res.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')
  return res
}
