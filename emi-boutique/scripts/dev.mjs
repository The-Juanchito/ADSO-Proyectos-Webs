// Arranca API local + Vite juntos. Uso: npm start
import { spawn } from 'node:child_process'
const hijos = [
  spawn(process.execPath, ['scripts/api.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
]
const salir = () => hijos.forEach((h) => h.kill())
process.on('SIGINT', salir)
process.on('exit', salir)
