export default {
  async fetch(request) {
    // 跨域预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({code:400, msg:'仅支持POST请求'}), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    try {
      // 转发到恢复后的第三方接口
      const upstream = await fetch('https://www.xzzsb.xyz/sport/sd/proxy.php', {
        method: 'POST',
        body: request.body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      const result = await upstream.text()
      return new Response(result, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (err) {
      return new Response(JSON.stringify({code:400, msg:'服务异常，请稍后重试'}), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}
