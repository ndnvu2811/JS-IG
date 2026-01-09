#!/usr/bin/env node
/**
 * Create portable package cho bạn bè
 * Chạy: node create-portable.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = __dirname;
const outputDir = path.join(projectRoot, 'portable-build');
const portableFolder = path.join(outputDir, 'Instagram-Tool-Care');

console.log('🔨 Creating portable package...');

// 1. Clean old output
if (fs.existsSync(outputDir)) {
  console.log('🗑️  Removing old build...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}

fs.mkdirSync(portableFolder, { recursive: true });

// 2. Copy essential files
const filesToCopy = [
  'dist',
  'electron',
  'node_modules',
  'package.json',
  'package-lock.json',
];

console.log('📋 Copying files...');
filesToCopy.forEach(file => {
  const src = path.join(projectRoot, file);
  const dest = path.join(portableFolder, file);
  
  if (fs.existsSync(src)) {
    console.log(`  ✓ ${file}`);
    if (fs.statSync(src).isDirectory()) {
      // Copy directory recursively
      copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
});

// 3. Create starter script
const starterScript = `@echo off
echo Starting Instagram Tool Care...
cd /d "%~dp0"
node -e "require('./electron/main.js')"
pause
`;

fs.writeFileSync(path.join(portableFolder, 'start.bat'), starterScript);
console.log('  ✓ start.bat');

// 4. Create README
const readme = `# Instagram Tool Care - Portable Version

## Hướng dẫn sử dụng

1. Cài đặt Node.js từ: https://nodejs.org/ (LTS version)
2. Chạy file: \`start.bat\`
3. App sẽ khởi động trong vài giây

## Yêu cầu hệ thống
- Windows 10/11 (64-bit)
- Node.js 18 hoặc cao hơn
- RAM: 4GB (khuyến nghị 8GB)
- Ổ đĩa: 2GB free space

## Troubleshoot
- Nếu gặp lỗi "node is not recognized", cần cài Node.js
- Nếu gặp lỗi file lock, restart máy tính
- Xóa folder \`data\` trong app folder để reset app

## Features
✓ Instagram account management
✓ Post scheduling
✓ Reel creation & scheduling
✓ Media library
✓ Care automation

---
Made with ❤️ by Nguyen Van Duc
`;

fs.writeFileSync(path.join(portableFolder, 'README.md'), readme);
console.log('  ✓ README.md');

// 5. Create zip
console.log('📦 Creating zip archive...');
const zipPath = path.join(outputDir, 'Instagram-Tool-Care-Portable.zip');

try {
  // Use PowerShell to create zip
  execSync(`powershell -Command "Compress-Archive -Path '${portableFolder}' -DestinationPath '${zipPath}' -Force"`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ Portable package created: ${zipPath}`);
  console.log(`\n📤 To share with others:`);
  console.log(`   1. Send file: ${zipPath}`);
  console.log(`   2. Recipient extracts zip`);
  console.log(`   3. Recipient runs: start.bat`);
} catch (error) {
  console.error('❌ Error creating zip:', error.message);
  console.log('\n💡 Workaround: Manually zip the folder at:');
  console.log(`   ${portableFolder}`);
}

// Helper function
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    // Skip large folders
    if (file === 'node_modules' || file === '.git') {
      return;
    }
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

console.log('\n✨ Done!');
