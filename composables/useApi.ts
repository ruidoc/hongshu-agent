export function useApi() {
  const { token, logout } = useAuth()

  function apiFetch<T>(url: string, opts: any = {}): Promise<T> {
    return $fetch<T>(url, {
      ...opts,
      headers: {
        ...opts.headers,
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
      onResponseError({ response }) {
        if (response.status === 401) {
          logout()
        }
      },
    })
  }

  return { apiFetch }
}
