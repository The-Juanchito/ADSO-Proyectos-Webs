// Función única de Netlify que atiende todas las rutas /api/*
import { manejar } from '../../server/router.mjs'

export default async (req) => manejar(req)

export const config = { path: '/api/*' }
