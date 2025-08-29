import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

/**
 * NSSA 网站 Cloudflare Worker
 * 处理静态网站托管和管理功能
 */

addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request))
  } catch (e) {
    event.respondWith(
      new Response('Internal Error', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )
  }
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 处理管理后台路由
  if (url.pathname.startsWith('/admin')) {
    return handleAdminRequest(request)
  }
  
  // 处理静态网站
  return handleStaticSite(request)
}

async function handleStaticSite(request) {
  const url = new URL(request.url)
  
  try {
    // 自定义资源映射
    const options = {
      mapRequestToAsset: req => {
        const url = new URL(req.url)
        
        // 处理根路径
        if (url.pathname === '/') {
          return mapRequestToAsset(new Request(`${url.origin}/index.html`, req))
        }
        
        // 处理 Hugo 的 clean URLs
        if (!url.pathname.includes('.') && !url.pathname.endsWith('/')) {
          return mapRequestToAsset(new Request(`${url.origin}${url.pathname}/index.html`, req))
        }
        
        return mapRequestToAsset(req)
      },
    }

    const page = await getAssetFromKV(request, options)
    
    // 添加安全头
    const response = new Response(page.body, page)
    
    // 设置缓存控制
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600')
    }
    
    // 安全头
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
    
  } catch (e) {
    // 如果资源不存在，返回 404 页面
    try {
      let notFoundResponse = await getAssetFromKV(request, {
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
      })
      
      return new Response(notFoundResponse.body, {
        ...notFoundResponse,
        status: 404,
        statusText: 'Not Found',
      })
    } catch (e) {
      return new Response('404 Not Found', {
        status: 404,
        statusText: 'Not Found',
      })
    }
  }
}

async function handleAdminRequest(request) {
  const url = new URL(request.url)
  
  // API 路由
  if (url.pathname.startsWith('/admin/api/')) {
    return handleAdminApiRequest(request)
  }
  
  // 管理界面
  return handleAdminInterface(request)
}

async function handleAdminApiRequest(request) {
  // 这里可以添加管理 API 逻辑
  return new Response(JSON.stringify({ message: 'Admin API' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

async function handleAdminInterface(request) {
  // 返回管理界面 HTML
  const adminHTML = getAdminHTML()
  
  return new Response(adminHTML, {
    headers: { 'Content-Type': 'text/html' },
  })
}

function getAdminHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NSSA 管理后台</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>NSSA 管理后台</h1>
        <p>管理功能正在开发中...</p>
    </div>
</body>
</html>
  `
}
