'use strict'
// Load .env from the project root so SMTP and other env vars are set (no extra package needed)
const path = require('path')
const fs = require('fs')
const envPath = path.resolve(__dirname, '.env')
try {
  const content = fs.readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq <= 0) return
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    process.env[key] = val
  })
} catch (e) {
  // .env missing or unreadable – ignore
}
