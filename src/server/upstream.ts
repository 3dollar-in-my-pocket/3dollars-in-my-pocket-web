import 'server-only';

function getApiOrigin(): string {
  const baseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      'API_BASE_URL or NEXT_PUBLIC_API_BASE_URL environment variable is required'
    );
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    throw new Error('API_BASE_URL must be a valid absolute URL');
  }
}

export function createApiUrl(
  pathname: string,
  searchParams?: URLSearchParams
): URL {
  const url = new URL(pathname, getApiOrigin());
  if (searchParams) url.search = searchParams.toString();
  return url;
}

export function getDeviceLocationHeaders(request: Request): HeadersInit {
  const headers: HeadersInit = {};
  const latitude = request.headers.get('X-Device-Latitude');
  const longitude = request.headers.get('X-Device-Longitude');

  if (latitude) headers['X-Device-Latitude'] = latitude;
  if (longitude) headers['X-Device-Longitude'] = longitude;

  return headers;
}
