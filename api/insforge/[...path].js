// Vercel Serverless Function Proxy for Insforge Backend
// Forwards all /api/insforge/* requests to http://43.157.228.75:7130/api/*
// Eliminates browser Mixed Content (HTTPS -> HTTP) and CORS blocks.

const INSFORGE_BACKEND = 'http://43.157.228.75:7130';
const DEFAULT_ANON_KEY = 'anon_0a75c32f9a5fa623748cae8ca28764bf213bc112';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer, Accept, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Preference-Applied, X-Total-Count');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pathParts = req.query.path;
    const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');

    // Reconstruct query parameters without the Vercel internal 'path' param
    const queryObj = { ...req.query };
    delete queryObj.path;
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(queryObj)) {
      if (Array.isArray(val)) {
        val.forEach(v => searchParams.append(key, v));
      } else if (val !== undefined && val !== null) {
        searchParams.append(key, val);
      }
    }
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const targetUrl = `${INSFORGE_BACKEND}/api/${subPath}${queryString}`;

    const headers = {
      'Authorization': req.headers['authorization'] || `Bearer ${DEFAULT_ANON_KEY}`,
      'Content-Type': req.headers['content-type'] || 'application/json'
    };
    if (req.headers['prefer']) headers['Prefer'] = req.headers['prefer'];
    if (req.headers['range']) headers['Range'] = req.headers['range'];

    const fetchOptions = {
      method: req.method,
      headers
    };

    if (['POST', 'PATCH', 'PUT'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Forward status code
    res.status(response.status);

    // Forward relevant response headers
    const contentRange = response.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);
    const prefApplied = response.headers.get('preference-applied');
    if (prefApplied) res.setHeader('Preference-Applied', prefApplied);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (err) {
    console.error('[Insforge Proxy Error]:', err);
    return res.status(502).json({
      error: 'PROXY_FETCH_ERROR',
      message: err.message || 'Failed to connect to Insforge backend'
    });
  }
}
