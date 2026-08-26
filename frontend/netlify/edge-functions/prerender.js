const BOT_UA_REGEX =
  /(googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora-link-preview|pinterest|slackbot|vkshare|w3c_validator)/i

const PRERENDER_TOKEN = 'gkn2CmEhSx835m7xNFU9'

export default async (request, context) => {
  const ua = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  const isAsset = url.pathname.match(
    /\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|ttf|svg|woff|eot|json)$/i
  )
  const isApi = url.pathname.startsWith('/api/')

  if (!isAsset && !isApi && BOT_UA_REGEX.test(ua) && request.method === 'GET') {
    const prerenderUrl =
      `https://service.prerender.io/${url.origin}${url.pathname}${url.search}`

    const headers = new Headers(request.headers)
    headers.set('X-Prerender-Token', PRERENDER_TOKEN)

    const prerenderResponse = await fetch(prerenderUrl, {
      method: 'GET',
      headers,
    })

    return prerenderResponse
  }

  return context.next()
}