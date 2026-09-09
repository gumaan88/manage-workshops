export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const devUserEmail = localStorage.getItem('dev_user_email') || 'eng.gumaan@gmail.com';
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Attach dev user email header for effortless local testing
  headers.set('x-dev-user-email', devUserEmail);

  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const json: any = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب');
  }

  return json.data;
}
