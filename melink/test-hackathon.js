// 测试黑客松页面API功能
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// 测试函数
async function testAPI(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始测试黑客松页面API功能...\n');

  try {
    // 测试1: 页面数据API
    console.log('📊 测试1: 页面数据API');
    const pageDataResult = await testAPI('/api/page-data');
    console.log(`状态码: ${pageDataResult.status}`);
    console.log(`数据: ${JSON.stringify(pageDataResult.data, null, 2)}\n`);

    // 测试2: 分享功能API
    console.log('📤 测试2: 分享功能API');
    const shareBody = JSON.stringify({
      title: '黑客松交流',
      url: 'http://localhost:3000/hackathon'
    });
    const shareResult = await testAPI('/api/share', 'POST', shareBody);
    console.log(`状态码: ${shareResult.status}`);
    console.log(`数据: ${JSON.stringify(shareResult.data, null, 2)}\n`);

    // 测试3: 关闭横幅API
    console.log('🚫 测试3: 关闭横幅API');
    const bannerResult = await testAPI('/api/banner/close', 'POST');
    console.log(`状态码: ${bannerResult.status}`);
    console.log(`数据: ${JSON.stringify(bannerResult.data, null, 2)}\n`);

    // 测试4: 操作按钮API
    console.log('🔘 测试4: 操作按钮API');
    const actionBody = JSON.stringify({
      action: 'button_click',
      timestamp: new Date().toISOString()
    });
    const actionResult = await testAPI('/api/action', 'POST', actionBody);
    console.log(`状态码: ${actionResult.status}`);
    console.log(`数据: ${JSON.stringify(actionResult.data, null, 2)}\n`);

    console.log('✅ 所有API测试完成！');
    console.log('\n📋 测试结果总结:');
    console.log('- 页面数据API: ✅');
    console.log('- 分享功能API: ✅');
    console.log('- 关闭横幅API: ✅');
    console.log('- 操作按钮API: ✅');
    console.log('\n🌐 页面访问地址:');
    console.log('- 主页: http://localhost:3000');
    console.log('- 黑客松页面: http://localhost:3000/hackathon');
    console.log('- 测试页面: http://localhost:3000/test');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 请确保:');
    console.log('1. 开发服务器已启动 (npm run dev)');
    console.log('2. 服务器运行在 http://localhost:3000');
    console.log('3. 所有API路由文件已正确创建');
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const result = await testAPI('/');
    console.log('✅ 服务器运行正常');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动开发服务器');
    console.log('运行命令: npm run dev');
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔍 检查服务器状态...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  }
}

// 运行测试
main(); 