// 演示数据脚本
// 运行此脚本可以创建一些示例相册

const { initDatabase, getDatabase, saveDatabase } = require('./config/database');
const Album = require('./models/Album');

async function createDemoData() {
  console.log('🎬 正在创建演示数据...');

  try {
    // 初始化数据库
    await initDatabase();

    // 创建示例相册
    const albums = [
      { name: '风景', description: '美丽的风景照片' },
      { name: '人物', description: '人物肖像和街拍' },
      { name: '美食', description: '美味的食物照片' },
      { name: '旅行', description: '旅行中的精彩瞬间' },
      { name: '动物', description: '可爱的动物照片' }
    ];

    for (const albumData of albums) {
      try {
        await Album.create(albumData);
        console.log(`✅ 创建相册: ${albumData.name}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`⏭️  相册已存在: ${albumData.name}`);
        } else {
          console.error(`❌ 创建相册失败: ${albumData.name}`, error.message);
        }
      }
    }

    console.log('');
    console.log('✨ 演示数据创建完成！');
    console.log('');
    console.log('💡 提示:');
    console.log('   1. 启动服务器: npm start');
    console.log('   2. 访问网站: http://localhost:3000');
    console.log('   3. 点击"上传照片"按钮上传你的照片');
    console.log('   4. 照片可以添加到不同的相册中');
    console.log('');

  } catch (error) {
    console.error('❌ 创建演示数据失败:', error);
  }
}

createDemoData();
