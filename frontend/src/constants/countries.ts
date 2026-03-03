// 前20个用户量最多的国家
export interface Country {
  code: string; // 用于文件名和API
  name: string; // 中文名称
  flag: string; // 国旗 emoji
  users: string; // 用户数量范围（仅供参考）
}

export const countries: Country[] = [
  { code: 'global', name: '全球', flag: '🌍', users: '100M+' },
  { code: 'United States', name: '美国', flag: '🇺🇸', users: '18-22M' },
  { code: 'India', name: '印度', flag: '🇮🇳', users: '11-15M' },
  { code: 'China', name: '中国', flag: '🇨🇳', users: '7-10M' },
  { code: 'Brazil', name: '巴西', flag: '🇧🇷', users: '3.5-5M' },
  { code: 'United Kingdom', name: '英国', flag: '🇬🇧', users: '2.5-4M' },
  { code: 'Germany', name: '德国', flag: '🇩🇪', users: '2-3.5M' },
  { code: 'Russia', name: '俄罗斯', flag: '🇷🇺', users: '1.5-3M' },
  { code: 'Canada', name: '加拿大', flag: '🇨🇦', users: '1.2-2M' },
  { code: 'France', name: '法国', flag: '🇫🇷', users: '1-2M' },
  { code: 'Japan', name: '日本', flag: '🇯🇵', users: '1-2M' },
  { code: 'Spain', name: '西班牙', flag: '🇪🇸', users: '0.8-1.5M' },
  { code: 'Italy', name: '意大利', flag: '🇮🇹', users: '0.7-1.4M' },
  { code: 'Netherlands', name: '荷兰', flag: '🇳🇱', users: '0.6-1.2M' },
  { code: 'Australia', name: '澳大利亚', flag: '🇦🇺', users: '0.6-1.2M' },
  { code: 'Pakistan', name: '巴基斯坦', flag: '🇵🇰', users: '0.6-1.1M' },
  { code: 'Turkey', name: '土耳其', flag: '🇹🇷', users: '0.5-1.0M' },
  { code: 'South Korea', name: '韩国', flag: '🇰🇷', users: '0.5-1.0M' },
  { code: 'Poland', name: '波兰', flag: '🇵🇱', users: '0.4-0.9M' },
  { code: 'Indonesia', name: '印度尼西亚', flag: '🇮🇩', users: '0.4-0.9M' },
  { code: 'Mexico', name: '墨西哥', flag: '🇲🇽', users: '0.4-0.9M' },
];

// 将国家代码转换为文件名格式
export function getDataFilename(type: 'user' | 'org', countryCode: string): string {
  if (type === 'org') {
    if (!countryCode || countryCode === 'global') return 'users-org.json';
    if (countryCode === 'China') return 'users-org-china.json';
    return `users-org-${countryCode.toLowerCase().replace(/\s+/g, '-')}.json`;
  } else {
    if (!countryCode || countryCode === 'global') return 'users.json';
    if (countryCode === 'China') return 'users-china.json';
    return `users-${countryCode.toLowerCase().replace(/\s+/g, '-')}.json`;
  }
}
