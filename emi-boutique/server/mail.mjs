import nodemailer from 'nodemailer'
import { esCorreo, escaparHtml } from './util.mjs'

/** ¿Hay SMTP configurado? (MAIL_HOST, MAIL_USER, MAIL_PASS) */
export const mailConfigurado = () =>
  !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS)

let transporte = null
function obtenerTransporte() {
  if (transporte) return transporte
  const puerto = Number(process.env.MAIL_PORT || 587)
  transporte = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: puerto,
    secure: puerto === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })
  return transporte
}

/** Permite a las pruebas interceptar los correos. */
export const bandeja = []

/**
 * Envía un correo HTML. Nunca lanza: un fallo de correo no debe romper la tienda.
 * Devuelve true si el SMTP lo aceptó.
 */
export async function enviarCorreo(para, asunto, html) {
  para = String(para || '').trim()
  if (!esCorreo(para)) return false
  if (process.env.MAIL_CAPTURE === '1') {
    bandeja.push({ para, asunto, html })
    return true
  }
  if (!mailConfigurado()) {
    console.log(`[correo] SIN SMTP -> ${para} | ${asunto}`)
    return false
  }
  try {
    await obtenerTransporte().sendMail({
      from: `"EMI Boutique" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: para,
      subject: asunto,
      html,
    })
    return true
  } catch (e) {
    console.error('[correo] ERROR SMTP:', e.message, '->', para, '|', asunto)
    return false
  }
}

/** Plantilla HTML con el estilo de EMI Boutique. */
export function plantillaCorreo(titulo, lineas, botonTexto = null, botonUrl = null) {
  const parrafos = lineas
    .map(
      (l) =>
        `<p style="margin:0 0 14px;color:#5f5361;font-size:15px;line-height:1.6">${escaparHtml(l)}</p>`
    )
    .join('')
  const boton =
    botonTexto && botonUrl
      ? `<p style="margin:24px 0 8px"><a href="${escaparHtml(botonUrl)}" style="display:inline-block;background:#c2577d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px">${escaparHtml(botonTexto)}</a></p>`
      : ''
  return (
    '<div style="background:#faf6f7;padding:32px 16px;font-family:Poppins,Arial,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(45,31,39,.08)">' +
    '<div style="background:#c2577d;padding:22px 28px"><span style="color:#fff;font-size:20px;font-weight:600">EMI<b>.</b>boutique</span></div>' +
    `<div style="padding:28px"><h1 style="margin:0 0 16px;color:#2d1f27;font-size:22px">${escaparHtml(titulo)}</h1>` +
    parrafos +
    boton +
    '</div>' +
    '<div style="padding:16px 28px;background:#faf6f7;color:#9a8f96;font-size:12px">Este correo se envió automáticamente desde EMI Boutique.</div>' +
    '</div></div>'
  )
}
