/**
 * Agrège les derniers posts Instagram (Meta Graph API) et TikTok (Login Kit / Open API).
 *
 * Variables Netlify (Site settings → Environment variables) :
 *
 * Instagram (compte professionnel ou créateur lié à une Page Facebook) :
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID — ID du compte Instagram Business (chiffres)
 *   INSTAGRAM_ACCESS_TOKEN      — Jeton d’accès Page Facebook longue durée avec au minimum
 *                                 les permissions pour lire les médias du compte IG lié.
 *   Étapes côté Meta : application Facebook → Instagram Graph API → générer un jeton
 *   pour la Page qui possède le compte Instagram.
 *
 * TikTok (optionnel, plus technique — le jeton utilisateur expire ; prévoir refresh OAuth) :
 *   TIKTOK_ACCESS_TOKEN — Bearer obtenu via OAuth avec le scope video.list
 *   (https://developers.tiktok.com/doc/tiktok-api-v2-video-list/)
 *
 * Sans ces variables, la fonction renvoie des tableaux vides : le site affiche alors
 * les repli (embed manuel / liens) définis dans reseaux-association.json.
 */

const GRAPH_VERSION = 'v21.0'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function pickInstagramImage(raw) {
  if (!raw) return null
  const t = raw.media_type
  if (t === 'IMAGE') return raw.media_url || null
  if (t === 'VIDEO') return raw.thumbnail_url || raw.media_url || null
  if (t === 'CAROUSEL_ALBUM') {
    const kids = raw.children?.data
    if (!kids?.length) return raw.thumbnail_url || raw.media_url || null
    const first = kids[0]
    if (first.media_type === 'VIDEO') return first.thumbnail_url || first.media_url || null
    return first.media_url || raw.thumbnail_url || null
  }
  return raw.media_url || raw.thumbnail_url || null
}

function normalizeInstagramPost(raw) {
  const imageUrl = pickInstagramImage(raw)
  if (!imageUrl || !raw.permalink) return null
  const cap = (raw.caption || 'Instagram').replace(/\s+/g, ' ').trim()
  return {
    id: raw.id,
    permalink: raw.permalink,
    imageUrl,
    captionAlt: cap.slice(0, 200) || 'Instagram'
  }
}

async function fetchInstagramMedia(limit) {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!igId || !token) {
    return { items: [], error: null }
  }
  const fields =
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url}'
  const params = new URLSearchParams({
    fields,
    limit: String(Math.min(Math.max(limit, 1), 25)),
    access_token: token
  })
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media?${params.toString()}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    return { items: [], error: data.error.message || 'Instagram Graph API error' }
  }
  const rows = (data.data || [])
    .map(normalizeInstagramPost)
    .filter(Boolean)
  return { items: rows, error: null }
}

async function fetchTikTokVideos(limit) {
  const token = process.env.TIKTOK_ACCESS_TOKEN
  if (!token) {
    return { items: [], error: null }
  }
  const max = Math.min(Math.max(limit, 1), 20)
  const fields = 'cover_image_url,id,title,share_url'
  const url = `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ max_count: max })
  })
  const json = await res.json()
  if (json.error && json.error.code && json.error.code !== 'ok') {
    return {
      items: [],
      error: json.error.message || String(json.error.code)
    }
  }
  const videos = (json.data?.videos || []).map((v) => ({
    id: v.id,
    title: v.title || '',
    cover_image_url: v.cover_image_url || '',
    share_url: v.share_url || ''
  }))
  return { items: videos, error: null }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() }
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const qs = event.queryStringParameters || {}
  const instagramLimit = Math.min(parseInt(qs.instagramLimit || '6', 10) || 6, 25)
  const tiktokLimit = Math.min(parseInt(qs.tiktokLimit || '6', 10) || 6, 20)

  const meta = {}
  const [ig, tt] = await Promise.all([
    fetchInstagramMedia(instagramLimit),
    fetchTikTokVideos(tiktokLimit)
  ])

  if (ig.error) meta.instagramError = ig.error
  if (tt.error) meta.tiktokError = tt.error

  return {
    statusCode: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      instagram: ig.items,
      tiktok: tt.items,
      meta
    })
  }
}
