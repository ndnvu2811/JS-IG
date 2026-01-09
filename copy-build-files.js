const fs = require('fs');
const path = require('path');

// Tạo build directory nếu chưa tồn tại
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('✅ Created build directory');
}

// Copy icon từ public sang build
const publicDir = path.join(__dirname, 'public');
const files = ['icon.ico', 'icon.png'];

files.forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(buildDir, file);
    
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file} to build directory`);
    } else {
        console.warn(`⚠️ ${file} not found in public directory`);
    }
});

console.log('✅ Build files setup completed');
