// Cloudflare Worker 后端代理脚本 - 部署后永久免费使用
export default {
  async fetch(request) {
    // 处理跨域预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({code:400, msg:'仅支持POST请求'}), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      // 接收前端传来的表单数据
      const formData = await request.formData();
      // 转发到真实刷步接口
      const targetRes = await fetch('https://www.xzzsb.xyz/sport/sd/proxy.php', {
        method: 'POST',
        body: formData
      });
      const result = await targetRes.text();
      // 返回结果给前端，带上跨域允许头
      return new Response(result, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({code:500, msg:'后端转发错误，请重试'}), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }
  }
}
