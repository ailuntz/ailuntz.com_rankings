# GitHub Rankings

[![Docker Pulls](https://img.shields.io/docker/pulls/ailuntz/rankings)](https://hub.docker.com/r/ailuntz/rankings)
[![Docker Image Size](https://img.shields.io/docker/image-size/ailuntz/rankings/latest)](https://hub.docker.com/r/ailuntz/rankings)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

GitHub 开发者 / 仓库 / 趋势榜单项目。  
当前部署模式为前后端分离：

- 前端：静态文件部署（例如 `/html/ailuntz.com_rankings`）
- 后端：Docker 容器，仅提供采集与 API

## API Base

生产环境 API 建议路径：

- `https://api.ailuntz.com/rankings/health`
- `https://api.ailuntz.com/rankings/data/repos.json`

## Features

- 用户榜：全球 + 20 国家
- 组织榜：全球 + 20 国家
- 仓库榜：全部 / 用户 / 组织
- 趋势榜：daily / weekly / monthly + 多语言
- 每日零点调度
- 启动时按“今日数据”检查并查缺补漏
- 任务失败不阻断整轮（记录失败并继续）

## Repo Structure

```text
ailuntz.com_rankings/
├── frontend/            # 前端（Vite + React）
├── rank/                # 后端采集与 API（Node + TS）
├── Dockerfile.rankings  # 后端容器镜像
└── README.md
```

## Run Backend With Docker

```bash
docker run -d --name ailuntz-rankings -p 3001:8080 \
  -e GITHUB_TOKEN=YOUR_GITHUB_TOKEN \
  -e FETCH_TIMEZONE=Asia/Shanghai \
  -e MAX_RANK=200 \
  -e API_PREFIX=/rankings \
  -e TASK_DELAY_MS=10000 \
  -e CORS_ALLOW_ORIGIN=* \
  -v ailuntz_ranking_data:/app/data \
  ailuntz/rankings:latest
```

## Environment Variables

- `GITHUB_TOKEN`: GitHub token（必填，避免低额度）
- `FETCH_TIMEZONE`: 调度时区，默认 `Asia/Shanghai`
- `MAX_RANK`: 每类榜单最大条数，默认 `200`
- `API_PREFIX`: API 前缀，默认 `/rankings`
- `TASK_DELAY_MS`: 任务间隔毫秒，默认 `10000`
- `CORS_ALLOW_ORIGIN`: 跨域来源，默认 `*`
- `DATA_DIR`: 数据目录，默认 `./data`
- `AUTO_FETCH`: 是否自动调度，默认 `true`

## Nginx Reverse Proxy (api.ailuntz.com)

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name api.ailuntz.com;

    ssl_certificate /usr/share/nginx/html_cert/ailuntz.com.pem;
    ssl_certificate_key /usr/share/nginx/html_cert/ailuntz.com.key;

    location /rankings/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## Frontend Build & Manual Copy

```bash
cd frontend
npm install
npm run build
rm -rf /Volumes/usb_main/usb_web/html/ailuntz.com_rankings/*
cp -R dist/* /Volumes/usb_main/usb_web/html/ailuntz.com_rankings/
```

前端默认读取：

- `VITE_API_BASE_URL=https://api.ailuntz.com`
- `VITE_API_PREFIX=/rankings`

## Notes

- GitHub Search API 容易限流，建议保留 `TASK_DELAY_MS` 并使用有效 token。
- Token 不要提交到代码或日志。
