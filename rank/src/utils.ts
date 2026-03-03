import fs from 'fs/promises';
import path from 'path';
import { config } from './config.js';

// 延迟函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 保存 JSON 数据
export async function saveJSON<T>(filename: string, data: T): Promise<void> {
  try {
    await fs.mkdir(config.dataDir, { recursive: true });
    const filepath = path.join(config.dataDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 数据已保存到: ${filepath}`);
  } catch (error) {
    console.error('❌ 保存数据失败:', error);
    throw error;
  }
}

// 格式化日期
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 打印 API 限制信息
export function printRateLimit(headers: Record<string, string>): void {
  const limit = headers['x-ratelimit-limit'];
  const remaining = headers['x-ratelimit-remaining'];
  const reset = headers['x-ratelimit-reset'];

  if (limit && remaining) {
    console.log(`   API 限制: ${remaining}/${limit}`);

    if (reset) {
      const resetDate = new Date(parseInt(reset) * 1000);
      console.log(`   重置时间: ${resetDate.toLocaleString()}`);
    }
  }
}
