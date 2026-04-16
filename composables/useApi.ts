export function useApi() {
  const { token } = useAuth()

  function apiFetch<T>(url: string, opts: any = {}): Promise<T> {
    return $fetch<T>(url, {
      ...opts,
      headers: {
        ...opts.headers,
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })
  }

  return { apiFetch }
}
