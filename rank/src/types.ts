// 精简的仓库数据类型
export interface RepoData {
  rank: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  updated_at: string;
  topics?: string[];
}

// 精简的用户数据类型
export interface UserData {
  rank: number;
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

// Trending 数据类型
export interface TrendingData {
  rank: number;
  full_name: string;
  language: string;
  color: string;
  description: string;
  forked: string;
  stargazers_count: number;
  todayStar: string;
  html_url: string;
}
