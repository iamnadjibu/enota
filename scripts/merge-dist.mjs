// Copies the admin build into the public build so Firebase Hosting serves it at /admin.
import { cpSync, rmSync, existsSync } from 'node:fs'

const from = 'admin-site/dist'
const to = 'Public-site/dist/admin'
if (!existsSync(from)) throw new Error(`${from} not found — build the admin site first`)
rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })
console.log(`Copied ${from} -> ${to}`)
