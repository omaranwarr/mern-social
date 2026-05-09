const BearerTokenStrategy = {
  getHeaders(credentials) {
    const t = credentials && credentials.t
    if (t == null || String(t) === '') return {}
    return { Authorization: 'Bearer ' + String(t) }
  }
}

const NoAuthStrategy = {
  getHeaders() {
    return {}
  }
}

let activeStrategy = BearerTokenStrategy

export function setAuthHeaderStrategy(strategy) {
  activeStrategy = strategy
}

export function getAuthHeadersFromCredentials(credentials) {
  return activeStrategy.getHeaders(credentials)
}

export function getAuthHeaders(token) {
  return BearerTokenStrategy.getHeaders({ t: token })
}

export function getAuthHeaderStrategy() {
  return activeStrategy
}

export { BearerTokenStrategy, NoAuthStrategy }
