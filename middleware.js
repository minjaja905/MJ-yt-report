export const config = { matcher: '/' };

export default function middleware(req) {
  const auth = req.headers.get('authorization');
  const pw = process.env.REPORT_PASSWORD || '0905';
  const expected = 'Basic ' + btoa('mj:' + pw);

  if (auth !== expected) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Giants TV Report"' },
    });
  }
}
