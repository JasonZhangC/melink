const http = require('http');
const fs = require('fs');
const path = require('path');

// 图片资源列表
const assets = [
  '59c703059763c215467f37e29240383bbd8eda59.png',
  '60092f071a6ca4334df62c5065160922d3eafeb7.png',
  'd69c41f95049fd47b70084db9a5184a28cc780f9.png',
  '2846143dc2dc00bed1a91a5384860bf8b2599502.svg',
  '8482aa204629ccd4099eb30e433db7b85e2563fd.svg',
  '1410e067db006763bb40c04ef79cdc1692c03cb2.svg',
  'f7481fc2238f527543122988b5b213d7895fa419.svg',
  '41b48aed0a734514f471271c3b2f04f8ef808dd3.svg',
  'f46695159d547b43fd3b827aa4a5d7399961fe6a.svg',
  '8ff3946837ad7b95d0f895dfb64a739a5b9d60b9.svg',
  'b86ba7b0980fd16a846c53b387b64045dd26a3ed.svg',
  'a966a2db7bb2814a3c8a8dff239ceccc1207817a.svg',
  'c2511ae3bcacd8e27bd2ae8e2bacf57f7d001ed1.svg'
];

const BASE_URL = 'http://localhost:3845/assets';
const OUTPUT_DIR = './public/assets';

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('开始下载图片资源...');
console.log(`目标目录: ${OUTPUT_DIR}`);

// 下载单个文件
function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${filename}`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`下载: ${filename}`);
    
    const req = http.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          console.log(`✅ ${filename}`);
          resolve(filename);
        });
      } else {
        console.log(`❌ ${filename} (${res.statusCode})`);
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    req.on('error', () => {
      console.log(`❌ ${filename} (网络错误)`);
      reject(new Error('网络错误'));
    });
  });
}

// 主函数
async function main() {
  let success = 0;
  let failed = 0;
  
  for (const filename of assets) {
    try {
      await downloadFile(filename);
      success++;
    } catch (error) {
      failed++;
    }
  }
  
  console.log(`\n完成: 成功 ${success} 个, 失败 ${failed} 个`);
}

main(); 