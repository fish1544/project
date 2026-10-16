export default {
  async fetch(request) {
    // 处理CORS预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({code:400, msg:'仅支持POST请求'}), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      const params = await request.formData();
      const account = params.get('user')?.trim();
      const password = params.get('password')?.trim();
      let step = parseInt(params.get('step')?.trim());

      if (!account || !password) {
        return new Response(JSON.stringify({code:400, msg:'请填写账号和密码'}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      if (!step || isNaN(step)) {
        // 随机安全步数7000-16000
        step = Math.floor(Math.random() * 9000) + 7000;
      }
      step = Math.min(Math.max(step, 100), 30000);

      // 公共请求头
      const commonHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'MiFit/6.12.0 (MCE16; Android 16; Density/1.5)',
        'App-Name': 'com.xiaomi.hm.health'
      };

      // 第一步：登录获取access code
      const loginUrl = `https://api-user.huami.com/registrations/${encodeURIComponent(account)}/tokens`;
      const loginBody = new URLSearchParams({
        client_id: 'HuaMi',
        country_code: 'CN',
        json_response: 'true',
        name: account,
        password: password,
        redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
        state: 'REDIRECTION',
        token: 'access'
      });
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: commonHeaders,
        body: loginBody.toString()
      });

      if (loginRes.status !== 200) {
        if (loginRes.status === 429) {
          return new Response(JSON.stringify({code:400, msg:'请求过于频繁，请稍后再试'}), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        return new Response(JSON.stringify({code:400, msg:'用户名或密码错误'}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const loginData = await loginRes.json();
      if (!loginData.access) {
        return new Response(JSON.stringify({code:400, msg:'用户名或密码错误'}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      const accessCode = loginData.access;

      // 第二步：获取login_token和user_id
      const tokenUrl = 'https://account.huami.com/v2/client/login';
      const tokenBody = new URLSearchParams({
        app_name: 'com.xiaomi.hm.health',
        country_code: 'CN',
        code: accessCode,
        device_id: '00:00:00:00:00:00',
        device_model: 'android_phone',
        app_version: '6.12.0',
        grant_type: 'access_token',
        allow_registration: 'false',
        source: 'com.xiaomi.hm.health',
        third_name: 'huami'
      });
      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: commonHeaders,
        body: tokenBody.toString()
      });

      if (tokenRes.status !== 200) {
        return new Response(JSON.stringify({code:400, msg:'登录失败，请重试'}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      const tokenData = await tokenRes.json();
      const loginToken = tokenData.token_info.login_token;
      const userId = tokenData.token_info.user_id;

      // 第三步：获取app_token
      const appTokenUrl = `https://account-cn.huami.com/v1/client/app_tokens?login_token=${loginToken}`;
      const appTokenRes = await fetch(appTokenUrl, {
        headers: commonHeaders
      });
      if (appTokenRes.status !== 200) {
        return new Response(JSON.stringify({code:400, msg:'获取令牌失败，请重试'}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      const appTokenData = await appTokenRes.json();
      const appToken = appTokenData.token_info.app_token;

      // 第四步：构造提交数据
      const timestamp = Math.floor(Date.now() / 1000);
      const today = new Date().toISOString().split('T')[0];
      const deviceId = '0000000000000000';

      // 构造步数JSON
      const summary = JSON.stringify({
        v: 6,
        slp: {
          st: 0, ed: 0, dp: 0, lt: 0, wk: 0, usrSt: -1440, usrEd: -1440,
          wc: 0, is: 0, lb: 0, to: 0, dt: 0, rhr: 0, ss: 0
        },
        stp: {
          ttl: step, dis: 0, cal: 0, wk: 0, rn: 0, runDist: 0, runCal: 0, stage: []
        },
        goal: 0,
        tz: '28800'
      });
      const dataObj = [{
        data_hr: '\\/v7+' + '\\/v7+'.repeat(479),
        date: today,
        data: [{
          start: 0, stop: 1439, value: 'A'.repeat(5760), tz: 32, did: deviceId, src: 24
        }],
        summary: summary,
        source: 24,
        type: 0
      }];
      const encodedData = encodeURIComponent(JSON.stringify(dataObj));

      // 提交步数
      const submitUrl = `https://api-mifit-cn.huami.com/v1/data/band_data.json?&t=${timestamp}`;
      const submitHeaders = {
        ...commonHeaders,
        apptoken: appToken
      };
      const submitBody = new URLSearchParams({
        userid: userId,
        last_sync_data_time: timestamp.toString(),
        device_type: '0',
        last_deviceid: deviceId,
        data_json: encodedData
      });
      const submitRes = await fetch(submitUrl, {
        method: 'POST',
        headers: submitHeaders,
        body: submitBody.toString()
      });
      const submitData = await submitRes.json();

      if (submitData.message === 'success') {
        return new Response(JSON.stringify({code:200, msg:`成功，本次步数${step}`}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        return new Response(JSON.stringify({code:400, msg:'提交失败：'+(submitData.message || '未知错误')}), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({code:400, msg:'网络错误，请重试：'+err.message}), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}
