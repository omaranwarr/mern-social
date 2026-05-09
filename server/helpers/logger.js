/**
 * Logger adapter: routes log output through one module so server code does not
 * depend on console directly (Adapter pattern for observability).
 */
export function info(...args) {
  console.log(...args)
}

export function error(...args) {
  console.error(...args)
}
