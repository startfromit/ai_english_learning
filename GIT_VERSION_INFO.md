# Git 版本信息功能

这个功能允许管理员在 `/admin/debug` 页面中查看当前部署版本的 Git 信息。

## 功能特点

- **构建时生成**：Git 信息在构建时生成，不会在运行时执行 Git 命令
- **安全可靠**：避免了生产环境中可能没有 Git 环境的问题
- **信息完整**：包含 commit ID、分支、作者、提交时间、构建时间等信息
- **权限控制**：只有管理员可以访问此功能

## 显示的信息

- **Commit ID**：完整的 Git commit hash
- **分支**：当前分支名称
- **提交信息**：最后一次提交的消息
- **作者**：最后一次提交的作者
- **提交时间**：最后一次提交的时间
- **构建时间**：应用构建的时间
- **工作目录状态**：构建时是否有未提交的更改

## 使用方法

1. 以管理员身份登录
2. 访问 `/admin/debug` 页面
3. 点击 "Git Version Info" 标签页
4. 查看当前版本的 Git 信息

## 技术实现

### 构建脚本

`scripts/generate-git-info.js` 在构建时执行，获取 Git 信息并生成 `src/lib/git-info.json` 文件。

### 自动集成

- `npm run dev` 和 `npm run build` 会自动执行 Git 信息生成
- 也可以手动运行 `npm run generate-git-info`

### 文件结构

```
scripts/
  generate-git-info.js          # 构建时脚本
src/
  lib/
    git-info.json              # 生成的 Git 信息文件
    git-info.ts                # TypeScript 类型定义和导入函数
  app/
    api/admin/git-info/        # API 路由
    admin/debug/_components/
      GitVersionInfo.tsx       # 前端组件
```

## 注意事项

- `src/lib/git-info.json` 文件被添加到 `.gitignore` 中，不会被提交到版本控制
- 每次构建都会重新生成 Git 信息
- 如果 Git 命令执行失败，会使用默认值
- 在生产环境中，Git 信息是静态的，不会动态更新

## 故障排除

如果 Git 信息显示不正确：

1. 确保项目是一个有效的 Git 仓库
2. 检查 `scripts/generate-git-info.js` 是否有执行权限
3. 查看构建日志中是否有 Git 相关的错误信息
4. 手动运行 `npm run generate-git-info` 查看输出 