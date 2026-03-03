# GitHub Rank - 后端数据获取

简单高效的 GitHub 排名数据获取工具，只保留前 200 名数据。

## 特性

- ✅ 精简的数据结构（只保留必要字段）
- ✅ 只获取前 200 名排名
- ✅ TypeScript 类型安全
- ✅ 自动去重
- ✅ API 限制提示

## 项目结构

```
rank/
├── src/
│   ├── types.ts           # 类型定义
│   ├── config.ts          # 配置文件
│   ├── utils.ts           # 工具函数
│   ├── fetchRepos.ts      # 获取仓库排名
│   ├── fetchUsers.ts      # 获取用户排名
│   └── fetchTrending.ts   # 获取趋势数据
├── data/                  # 输出数据目录
├── dist/                  # 编译后的 JS 文件
├── package.json
├── tsconfig.json
└── .env                   # 环境变量（需创建）
```

## 快速开始

### 1. 安装依赖

```bash
cd rank
npm install
```

### 2. 配置 GitHub Token

复制 `.env.example` 为 `.env`，并填入你的 GitHub Token：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
GITHUB_TOKEN=your_github_personal_access_token
```

**如何获取 Token：**
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选 `public_repo` 权限
4. 生成并复制 token

### 3. 编译 TypeScript

```bash
npm run build
```

### 4. 获取数据

#### 获取仓库排名（前 200）

```bash
npm run fetch:repos
```

输出文件：`data/repos.json`

#### 获取用户排名（前 200）

**注意**：用户数据需要调用额外的 API 获取详细信息，200 个用户约需 2-3 分钟。

```bash
# 全球用户
npm run fetch:users

# 中国用户
npm run fetch:users:china

# 组织（Organization）
npm run fetch:users:org
```

输出文件：
- `data/users.json`（全球用户）
- `data/users-china.json`（中国用户）
- `data/users-org.json`（组织）

#### 获取 Trending 数据

**注意**：GitHub Trending 页面只显示约 25 个项目，无法获取 200 条。

```bash
# 日榜
npm run fetch:trending

# 周榜
npm run fetch:trending weekly

# 月榜
npm run fetch:trending monthly
```

输出文件（约 25 条）：
- `data/trending-daily.json`
- `data/trending-weekly.json`
- `data/trending-monthly.json`

#### 一键获取所有数据

```bash
npm run fetch:all
```

## 数据结构

### 仓库数据 (RepoData)

```typescript
{
  rank: number;              // 排名
  full_name: string;         // 完整名称
  html_url: string;          // GitHub 链接
  description: string;       // 描述
  stargazers_count: number;  // Star 数
  forks_count: number;       // Fork 数
  language: string;          // 主要语言
  owner: {
    login: string;           // 所有者名称
    avatar_url: string;      // 头像
  };
  updated_at: string;        // 更新时间
  topics: string[];          // 主题标签
}
```

### 用户数据 (UserData)

```typescript
{
  rank: number;              // 排名
  login: string;             // 用户名
  id: number;                // ID
  avatar_url: string;        // 头像
  html_url: string;          // GitHub 链接
  followers: number;         // 粉丝数
  following: number;         // 关注数
  public_repos: number;      // 公开仓库数
  created_at: string;        // 账号创建时间
}
```

### Trending 数据 (TrendingData)

```typescript
{
  rank: number;              // 排名
  full_name: string;         // 完整名称
  language: string;          // 语言
  color: string;             // 语言颜色
  description: string;       // 描述
  forked: string;            // Fork 数
  stargazers_count: number;  // Star 数
  todayStar: string;         // 今日新增 Star
  html_url: string;          // GitHub 链接
}
```

## 配置说明

在 `src/config.ts` 中可以修改以下配置：

```typescript
{
  maxRank: 200,          // 最大排名数量
  perPage: 100,          // 每页数据量
  minStars: 8000,        // 仓库最小 Star 数
  minFollowers: 1000,    // 用户最小粉丝数
  dataDir: './data',     // 数据输出目录
}
```

## 注意事项

1. **GitHub API 限制**：
   - 未认证：60 次/小时
   - 已认证：5000 次/小时
   - 建议配置 GITHUB_TOKEN

2. **数据更新频率**：
   - 建议每天更新一次
   - Trending 数据建议每小时更新

3. **错误处理**：
   - 如遇到 API 限制，脚本会显示重置时间
   - 网络错误会自动抛出异常

## 下一步

前端开发使用：
- React
- shadcn/ui
- TailwindCSS
- Radix UI

数据通过 JSON 文件提供给前端使用。

## License

MIT
