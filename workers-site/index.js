import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  // 删除admin域名处理

  // 处理PV统计API请求
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(event.request, url)
  }

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }

    const page = await getAssetFromKV(event, options)

    // allow headers to be altered
    const response = new Response(page.body, page)

    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'unsafe-url')
    // 移除错误的 Feature-Policy 头部
    // response.headers.set('Feature-Policy', 'none')

    return response

  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}



/**
 * 处理PV统计API请求
 */
async function handleApiRequest(request, url) {
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (url.pathname === '/api/views/get') {
      // 获取文章PV数
      return await getArticleViews(request, corsHeaders)
    } else if (url.pathname === '/api/views/increment') {
      // 增加文章PV数
      return await incrementArticleViews(request, corsHeaders)
    } else if (url.pathname === '/api/views/batch') {
      // 批量获取多篇文章的PV数
      return await getBatchArticleViews(request, corsHeaders)
    } else if (url.pathname === '/api/likes/get') {
      // 获取文章点赞数
      return await getArticleLikes(request, corsHeaders)
    } else if (url.pathname === '/api/likes/toggle') {
      // 切换文章点赞状态
      return await toggleArticleLike(request, corsHeaders)
    } else if (url.pathname === '/api/likes/batch') {
      // 批量获取多篇文章的点赞数
      return await getBatchArticleLikes(request, corsHeaders)
    }

    return new Response('API endpoint not found', {
      status: 404,
      headers: corsHeaders
    })
  } catch (error) {
    return new Response(`API Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
}

/**
 * 获取单篇文章的PV数
 */
async function getArticleViews(request, corsHeaders) {
  const url = new URL(request.url)
  const articlePath = url.searchParams.get('path')

  if (!articlePath) {
    return new Response('Missing article path', {
      status: 400,
      headers: corsHeaders
    })
  }

  const key = `views:${articlePath}`
  const views = await ARTICLE_STATS.get(key) || '0'

  return new Response(JSON.stringify({
    path: articlePath,
    views: parseInt(views)
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * 增加文章PV数
 */
async function incrementArticleViews(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  const body = await request.json()
  const { path: articlePath, clientId } = body

  if (!articlePath) {
    return new Response('Missing article path', {
      status: 400,
      headers: corsHeaders
    })
  }

  // 防重复计数：检查24小时内是否已经计数
  const viewKey = `views:${articlePath}`
  const clientKey = `client:${articlePath}:${clientId}`

  // 检查客户端是否在24小时内已经访问过
  const lastVisit = await ARTICLE_STATS.get(clientKey)
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  if (lastVisit && (now - parseInt(lastVisit)) < oneDayMs) {
    // 24小时内已访问，不增加计数，但返回当前阅读数
    const views = await ARTICLE_STATS.get(viewKey) || '0'
    return new Response(JSON.stringify({
      path: articlePath,
      views: parseInt(views),
      incremented: false,
      reason: 'Already counted within 24 hours'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }

  // 增加PV数
  const currentViews = await ARTICLE_STATS.get(viewKey) || '0'
  const newViews = parseInt(currentViews) + 1

  // 更新PV数和客户端访问记录
  await ARTICLE_STATS.put(viewKey, newViews.toString())
  await ARTICLE_STATS.put(clientKey, now.toString(), { expirationTtl: 86400 }) // 24小时过期

  return new Response(JSON.stringify({
    path: articlePath,
    views: newViews,
    incremented: true
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * 批量获取多篇文章的PV数
 */
async function getBatchArticleViews(request, corsHeaders) {
  const url = new URL(request.url)
  const pathsParam = url.searchParams.get('paths')

  if (!pathsParam) {
    return new Response('Missing paths parameter', {
      status: 400,
      headers: corsHeaders
    })
  }

  const paths = pathsParam.split(',')
  const results = {}

  // 并行获取所有文章的PV数
  const promises = paths.map(async (path) => {
    const key = `views:${path.trim()}`
    const views = await ARTICLE_STATS.get(key) || '0'
    results[path.trim()] = parseInt(views)
  })

  await Promise.all(promises)

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * 获取单篇文章的点赞数
 */
async function getArticleLikes(request, corsHeaders) {
  const url = new URL(request.url)
  const articlePath = url.searchParams.get('path')
  const clientId = url.searchParams.get('clientId')

  if (!articlePath) {
    return new Response('Missing article path', {
      status: 400,
      headers: corsHeaders
    })
  }

  const likesKey = `likes:${articlePath}`
  const userLikeKey = `user_like:${articlePath}:${clientId}`

  const likes = await ARTICLE_STATS.get(likesKey) || '0'
  const userLiked = clientId ? (await ARTICLE_STATS.get(userLikeKey)) === 'true' : false

  return new Response(JSON.stringify({
    path: articlePath,
    likes: parseInt(likes),
    userLiked: userLiked
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * 切换文章点赞状态
 */
async function toggleArticleLike(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  const body = await request.json()
  const { path: articlePath, clientId } = body

  if (!articlePath || !clientId) {
    return new Response('Missing article path or client ID', {
      status: 400,
      headers: corsHeaders
    })
  }

  const likesKey = `likes:${articlePath}`
  const userLikeKey = `user_like:${articlePath}:${clientId}`

  // 检查用户当前点赞状态
  const currentUserLiked = (await ARTICLE_STATS.get(userLikeKey)) === 'true'
  const currentLikes = parseInt(await ARTICLE_STATS.get(likesKey) || '0')

  let newLikes
  let newUserLiked

  if (currentUserLiked) {
    // 取消点赞
    newLikes = Math.max(0, currentLikes - 1)
    newUserLiked = false
    await ARTICLE_STATS.delete(userLikeKey)
  } else {
    // 添加点赞
    newLikes = currentLikes + 1
    newUserLiked = true
    await ARTICLE_STATS.put(userLikeKey, 'true')
  }

  // 更新总点赞数
  await ARTICLE_STATS.put(likesKey, newLikes.toString())

  return new Response(JSON.stringify({
    path: articlePath,
    likes: newLikes,
    userLiked: newUserLiked,
    action: newUserLiked ? 'liked' : 'unliked'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * 批量获取多篇文章的点赞数
 */
async function getBatchArticleLikes(request, corsHeaders) {
  const url = new URL(request.url)
  const pathsParam = url.searchParams.get('paths')
  const clientId = url.searchParams.get('clientId')

  if (!pathsParam) {
    return new Response('Missing paths parameter', {
      status: 400,
      headers: corsHeaders
    })
  }

  const paths = pathsParam.split(',')
  const results = {}

  // 并行获取所有文章的点赞数
  const promises = paths.map(async (path) => {
    const likesKey = `likes:${path.trim()}`
    const userLikeKey = `user_like:${path.trim()}:${clientId}`

    const likes = await ARTICLE_STATS.get(likesKey) || '0'
    const userLiked = clientId ? (await ARTICLE_STATS.get(userLikeKey)) === 'true' : false

    results[path.trim()] = {
      likes: parseInt(likes),
      userLiked: userLiked
    }
  })

  await Promise.all(promises)

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
function handlePrefix(prefix) {
  return request => {
    // compute the default (e.g. / -> index.html)
    let defaultAssetKey = mapRequestToAsset(request)
    let url = new URL(defaultAssetKey.url)

    // strip the prefix from the path for lookup
    url.pathname = url.pathname.replace(prefix, '/')

    // inherit all other props from the default request
    return new Request(url.toString(), defaultAssetKey)
  }
}










