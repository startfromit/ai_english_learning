export interface GitInfo {
  commitId: string;
  commitMessage: string;
  author: string;
  date: string;
  branch: string;
  isDirty: boolean;
  buildTime: string;
}

// 导入构建时生成的 Git 信息
let gitInfo: GitInfo;

try {
  // 在开发环境中，动态导入 JSON 文件
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：尝试从文件系统读取
    const fs = require('fs');
    const path = require('path');
    const gitInfoPath = path.join(process.cwd(), 'src', 'lib', 'git-info.json');
    
    if (fs.existsSync(gitInfoPath)) {
      gitInfo = JSON.parse(fs.readFileSync(gitInfoPath, 'utf8'));
    } else {
      // 如果文件不存在，生成默认信息
      gitInfo = {
        commitId: 'development',
        commitMessage: 'Development build',
        author: 'developer',
        date: new Date().toISOString(),
        branch: 'development',
        isDirty: false,
        buildTime: new Date().toISOString()
      };
    }
  } else {
    // 生产环境：静态导入
    gitInfo = require('./git-info.json');
  }
} catch (error) {
  // 如果导入失败，使用默认值
  gitInfo = {
    commitId: 'unknown',
    commitMessage: 'Git information not available',
    author: 'unknown',
    date: new Date().toISOString(),
    branch: 'unknown',
    isDirty: false,
    buildTime: new Date().toISOString()
  };
}

export function getGitInfo(): GitInfo {
  return gitInfo;
} 