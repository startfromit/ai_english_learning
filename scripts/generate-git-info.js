const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // 获取 Git 信息
  const commitId = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const commitMessage = execSync('git log -1 --pretty=format:%s', { encoding: 'utf8' }).trim();
  const author = execSync('git log -1 --pretty=format:%an', { encoding: 'utf8' }).trim();
  const date = execSync('git log -1 --pretty=format:%cd --date=iso', { encoding: 'utf8' }).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  const isDirty = status.length > 0;

  // 创建 Git 信息对象
  const gitInfo = {
    commitId,
    commitMessage,
    author,
    date,
    branch,
    isDirty,
    buildTime: new Date().toISOString()
  };

  // 写入到文件
  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'git-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(gitInfo, null, 2));

  console.log('✅ Git info generated successfully:');
  console.log(`   Commit: ${commitId.substring(0, 8)}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Message: ${commitMessage}`);
  console.log(`   Dirty: ${isDirty}`);

} catch (error) {
  console.error('❌ Failed to generate git info:', error.message);
  
  // 如果 Git 命令失败，创建一个默认的 Git 信息文件
  const defaultGitInfo = {
    commitId: 'unknown',
    commitMessage: 'Git information not available',
    author: 'unknown',
    date: new Date().toISOString(),
    branch: 'unknown',
    isDirty: false,
    buildTime: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, '..', 'src', 'lib', 'git-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(defaultGitInfo, null, 2));
  
  console.log('⚠️  Created default git info file');
} 