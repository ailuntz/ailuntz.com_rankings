# GitHub Ranking Project

GitHub 排名系统 - 现代化重构版

## 项目简介

这是一个基于两个老旧 GitHub 排名项目的现代化重构：
- [gitstar-ranking](https://github.com/k0kubun/gitstar-ranking) (已移除)
- [github-rank](https://github.com/jaywcjlove/github-rank) (参考保留)

## 项目结构

```
ailuntz.com_ranking/
├── github-rank/          # 老项目参考（保留）
├── rank/                 # 新项目 - 后端数据获取
│   ├── src/             # TypeScript 源码
│   ├── data/            # 输出的 JSON 数据
│   └── README.md        # 后端文档
└── README.md            # 本文件
```

## 技术栈

### 后端（当前完成）
- Node.js + TypeScript
- GitHub API v3
- Cheerio（网页爬虫）
- 数据输出：JSON 文件

### 前端（计划）
- React 18
- shadcn/ui
- TailwindCSS
- Radix UI
- Vite

## 核心改进

### 相比老项目的优化

1. **删除 gitstar-ranking**
   - 过度工程化（Rails + 数据库）
   - 运维成本高
   - 技术栈老旧

2. **精简数据结构**
   - 只保留展示必需的字段
   - 减少 JSON 文件体积约 70%

3. **限制数据量**
   - 只保留前 200 名排名
   - 减少 API 请求次数
   - 加快页面加载速度

4. **现代化架构**
   - TypeScript 类型安全
   - 静态生成（SSG）
   - 零服务器成本

## 数据来源

### 1. 用户排名
- **API**: GitHub Search Users API
- **条件**: followers > 8000
- **分类**: 全球用户、中国用户、组织
- **数量**: Top 200

### 2. 仓库排名
- **API**: GitHub Search Repositories API
- **条件**: stars > 8000
- **数量**: Top 200

### 3. Trending 趋势
- **方式**: 网页爬虫
- **URL**: https://github.com/trending
- **周期**: 日榜、周榜、月榜
- **数量**: 约 25 条（GitHub 页面限制）

## 快速开始

### 后端开发

```bash
# 进入后端目录
cd rank

# 安装依赖
npm install

# 配置 GitHub Token
cp .env.example .env
# 编辑 .env 填入 token

# 编译 TypeScript
npm run build

# 获取数据
npm run fetch:all
```

详见 [rank/README.md](./rank/README.md)

### 前端开发（待开发）

即将使用：
- React 18
- shadcn/ui 组件库
- TailwindCSS 样式
- Radix UI 无障碍组件

## 数据文件

后端生成的 JSON 文件位于 `rank/data/`:

```
data/
├── users.json              # 全球用户 Top 200
├── users-china.json        # 中国用户 Top 200
├── users-org.json          # 组织 Top 200
├── repos.json              # 仓库 Top 200
├── trending-daily.json     # 日榜 ~25 条
├── trending-weekly.json    # 周榜 ~25 条
└── trending-monthly.json   # 月榜 ~25 条
```

## 开发计划

- [x] 删除旧项目 gitstar-ranking
- [x] 精简 JSON 数据字段
- [x] 实现前 200 名数据过滤
- [x] 后端数据获取脚本
- [ ] React 前端项目搭建
- [ ] shadcn/ui 组件集成
- [ ] 响应式页面布局
- [ ] 数据可视化图表
- [ ] 搜索和筛选功能
- [ ] 暗黑模式支持
- [ ] 部署到 Vercel/Netlify

## 参考项目

- 原项目 1: https://github.com/k0kubun/gitstar-ranking
- 原项目 2: https://github.com/jaywcjlove/github-rank

## License

MIT
