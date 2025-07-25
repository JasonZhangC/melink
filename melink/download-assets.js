// 下载黑客松页面所需的图片资源
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 图片资源列表（从HTML文件中提取）
const assets = [
  // 主要图片
  '59c703059763c215467f37e29240383bbd8eda59.png', // 头像
  '60092f071a6ca4334df62c5065160922d3eafeb7.png', // 活动背景图片
  'd69c41f95049fd47b70084db9a5184a28cc780f9.png', // 分享图标
  
  // SVG图标
  '2846143dc2dc00bed1a91a5384860bf8b2599502.svg', // 蜂窝信号
  '8482aa204629ccd4099eb30e433db7b85e2563fd.svg', // WiFi
  '1410e067db006763bb40c04ef79cdc1692c03cb2.svg', // 电池盖
  'f7481fc2238f527543122988b5b213d7895fa419.svg', // 箭头向下
  '41b48aed0a734514f471271c3b2f04f8ef808dd3.svg', // 位置图标
  'f46695159d547b43fd3b827aa4a5d7399961fe6a.svg', // 会议图标
  '8ff3946837ad7b95d0f895dfb64a739a5b9d60b9.svg', // 按钮背景
  'b86ba7b0980fd16a846c53b387b64045dd26a3ed.svg', // 渐变背景
  'a966a2db7bb2814a3c8a8dff239ceccc1207817a.svg', // 关闭按钮
  'c2511ae3bcacd8e27bd2ae8e2bacf57f7d001ed1.svg'  // 圆形按钮
];

const BASE_URL = 'http://localhost:3845/assets';
const OUTPUT_DIR = './public/assets';

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 下载单个文件
function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${filename}`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`正在下载: ${filename}`);
    
    const client = http;
    const req = client.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ 下载完成: ${filename}`);
          resolve(filename);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // 删除不完整的文件
          reject(err);
        });
      } else {
        console.log(`❌ 下载失败: ${filename} (状态码: ${res.statusCode})`);
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ 网络错误: ${filename}`);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 下载所有文件
async function downloadAllAssets() {
  console.log('🚀 开始下载图片资源...');
  console.log(`目标目录: ${OUTPUT_DIR}`);
  console.log(`源地址: ${BASE_URL}`);
  console.log('');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const filename of assets) {
    try {
      await downloadFile(filename);
      results.success.push(filename);
    } catch (error) {
      console.log(`❌ ${filename} 下载失败: ${error.message}`);
      results.failed.push(filename);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('📊 下载结果统计:');
  console.log(`✅ 成功: ${results.success.length} 个文件`);
  console.log(`❌ 失败: ${results.failed.length} 个文件`);
  
  if (results.success.length > 0) {
    console.log('');
    console.log('✅ 成功下载的文件:');
    results.success.forEach(file => console.log(`  - ${file}`));
  }
  
  if (results.failed.length > 0) {
    console.log('');
    console.log('❌ 下载失败的文件:');
    results.failed.forEach(file => console.log(`  - ${file}`));
    console.log('');
    console.log('💡 建议:');
    console.log('1. 检查图片服务器是否运行在 http://localhost:3845');
    console.log('2. 检查网络连接');
    console.log('3. 手动下载失败的文件');
  }
  
  return results;
}

// 检查服务器是否可用
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/placeholder.svg`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 主函数
async function main() {
  console.log('🔍 检查图片服务器状态...');
  const serverAvailable = await checkServer();
  
  if (!serverAvailable) {
    console.log('❌ 图片服务器不可用');
    console.log(`请确保图片服务器运行在: ${BASE_URL}`);
    console.log('');
    console.log('💡 解决方案:');
    console.log('1. 启动图片服务器');
    console.log('2. 或者手动下载图片文件到 public/assets/ 目录');
    console.log('3. 或者使用占位符图片进行测试');
    return;
  }
  
  console.log('✅ 图片服务器可用，开始下载...');
  console.log('');
  
  await downloadAllAssets();
}

// 运行脚本
main().catch(console.error); 