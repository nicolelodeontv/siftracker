// Lets Node's test runner resolve the "@/..." path alias used by the app code.
import { register } from 'node:module'
register('./alias-hooks.mjs', import.meta.url)
