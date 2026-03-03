import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import type { UserData, RepoData, TrendingData } from './types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { countries, getDataFilename } from './constants/countries'
import { languages, getTrendingFilename } from './constants/languages'

function App() {
  // 国家选择状态（默认选择全球）
  const [selectedUserCountry, setSelectedUserCountry] = useState('global')
  const [selectedOrgCountry, setSelectedOrgCountry] = useState('global')

  // 仓库类型选择状态
  const [selectedRepoType, setSelectedRepoType] = useState<'all' | 'user' | 'org'>('all')

  // 编程语言选择状态（默认全部）
  const [selectedLanguage, setSelectedLanguage] = useState('')

  // 数据状态
  const [users, setUsers] = useState<UserData[]>([])
  const [orgs, setOrgs] = useState<UserData[]>([])
  const [repos, setRepos] = useState<RepoData[]>([])
  const [trendingDaily, setTrendingDaily] = useState<TrendingData[]>([])
  const [trendingWeekly, setTrendingWeekly] = useState<TrendingData[]>([])
  const [trendingMonthly, setTrendingMonthly] = useState<TrendingData[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, setTheme } = useTheme()

  // 加载初始数据（标记为不加载中）
  useEffect(() => {
    setLoading(false)
  }, [])

  // 根据选择的语言加载趋势数据
  useEffect(() => {
    const dailyFile = getTrendingFilename('daily', selectedLanguage)
    const weeklyFile = getTrendingFilename('weekly', selectedLanguage)
    const monthlyFile = getTrendingFilename('monthly', selectedLanguage)

    Promise.all([
      fetch(`/data/${dailyFile}`).then(res => res.json()),
      fetch(`/data/${weeklyFile}`).then(res => res.json()),
      fetch(`/data/${monthlyFile}`).then(res => res.json()),
    ])
      .then(([daily, weekly, monthly]) => {
        setTrendingDaily(daily)
        setTrendingWeekly(weekly)
        setTrendingMonthly(monthly)
      })
      .catch(err => {
        console.error('获取趋势数据失败:', err)
        setTrendingDaily([])
        setTrendingWeekly([])
        setTrendingMonthly([])
      })
  }, [selectedLanguage])

  // 根据选择的类型加载仓库数据
  useEffect(() => {
    let filename = 'repos.json' // 默认全部
    if (selectedRepoType === 'user') {
      filename = 'repos-user.json'
    } else if (selectedRepoType === 'org') {
      filename = 'repos-org.json'
    }

    fetch(`/data/${filename}`)
      .then(res => res.json())
      .then(data => setRepos(data))
      .catch(err => {
        console.error(`获取${selectedRepoType === 'user' ? '用户' : selectedRepoType === 'org' ? '组织' : '全部'}仓库数据失败:`, err)
        setRepos([])
      })
  }, [selectedRepoType])

  // 根据选择的国家加载用户数据
  useEffect(() => {
    const filename = getDataFilename('user', selectedUserCountry)
    fetch(`/data/${filename}`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => {
        console.error(`获取${selectedUserCountry || '全球'}用户数据失败:`, err)
        setUsers([])
      })
  }, [selectedUserCountry])

  // 根据选择的国家加载组织数据
  useEffect(() => {
    const filename = getDataFilename('org', selectedOrgCountry)
    fetch(`/data/${filename}`)
      .then(res => res.json())
      .then(data => setOrgs(data))
      .catch(err => {
        console.error(`获取${selectedOrgCountry || '全球'}组织数据失败:`, err)
        setOrgs([])
      })
  }, [selectedOrgCountry])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-gradient-from)] via-[var(--color-gradient-via)] to-[var(--color-gradient-to)]">
        <div className="text-xl font-semibold text-[var(--color-text-primary)]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-from)] via-[var(--color-gradient-via)] to-[var(--color-gradient-to)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent pb-1 mb-3 leading-tight">
              GitHub Rankings
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg font-medium mt-1">
              发现全球最受欢迎的开发者、仓库和热门项目
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[var(--color-bg-card)] px-4 py-2 rounded-full shadow-lg">
            <span className="text-2xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </header>

        {/* 主标签页 */}
        <Card className="backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="developers" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="developers">
                  👥 开发者
                </TabsTrigger>
                <TabsTrigger value="repos">
                  ⭐ 仓库
                </TabsTrigger>
                <TabsTrigger value="trending">
                  🔥 趋势
                </TabsTrigger>
              </TabsList>

              {/* 开发者标签页（嵌套） */}
              <TabsContent value="developers">
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="users">
                      👤 用户
                    </TabsTrigger>
                    <TabsTrigger value="orgs">
                      🏢 组织
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="users" className="mt-0">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        选择国家/地区
                      </label>
                      <Select value={selectedUserCountry} onValueChange={setSelectedUserCountry}>
                        <SelectTrigger className="w-full md:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      {users.length === 0 ? (
                        <div className="text-center text-[var(--color-text-tertiary)] py-8">
                          暂无数据
                        </div>
                      ) : (
                        users.map(user => (
                          <UserCard key={user.id} user={user} />
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="orgs" className="mt-0">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        选择国家/地区
                      </label>
                      <Select value={selectedOrgCountry} onValueChange={setSelectedOrgCountry}>
                        <SelectTrigger className="w-full md:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      {orgs.length === 0 ? (
                        <div className="text-center text-[var(--color-text-tertiary)] py-8">
                          暂无数据
                        </div>
                      ) : (
                        orgs.map(org => (
                          <UserCard key={org.id} user={org} />
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* 仓库标签页（嵌套） */}
              <TabsContent value="repos">
                <Tabs defaultValue="all" className="w-full" value={selectedRepoType} onValueChange={(value) => setSelectedRepoType(value as 'all' | 'user' | 'org')}>
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="all">
                      📦 全部仓库
                    </TabsTrigger>
                    <TabsTrigger value="user">
                      👤 用户仓库
                    </TabsTrigger>
                    <TabsTrigger value="org">
                      🏢 组织仓库
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-3 mt-0">
                    {repos.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      repos.map(repo => (
                        <RepoCard key={repo.full_name} repo={repo} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="user" className="space-y-3 mt-0">
                    {repos.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      repos.map(repo => (
                        <RepoCard key={repo.full_name} repo={repo} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="org" className="space-y-3 mt-0">
                    {repos.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      repos.map(repo => (
                        <RepoCard key={repo.full_name} repo={repo} />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* 趋势标签页（嵌套） */}
              <TabsContent value="trending">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    选择编程语言
                  </label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.code || 'all'} value={lang.code}>
                          {lang.icon} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="daily" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="daily">
                      📅 今日
                    </TabsTrigger>
                    <TabsTrigger value="weekly">
                      📊 本周
                    </TabsTrigger>
                    <TabsTrigger value="monthly">
                      📈 本月
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="daily" className="space-y-3 mt-0">
                    {trendingDaily.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      trendingDaily.map(item => (
                        <TrendingCard key={item.rank} item={item} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="weekly" className="space-y-3 mt-0">
                    {trendingWeekly.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      trendingWeekly.map(item => (
                        <TrendingCard key={item.rank} item={item} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="monthly" className="space-y-3 mt-0">
                    {trendingMonthly.length === 0 ? (
                      <div className="text-center text-[var(--color-text-tertiary)] py-8">
                        暂无数据
                      </div>
                    ) : (
                      trendingMonthly.map(item => (
                        <TrendingCard key={item.rank} item={item} />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 用户卡片组件
function UserCard({ user }: { user: UserData }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-[var(--color-bg-card)] border-[var(--color-border)] hover:shadow-lg hover:border-[var(--color-border-hover)] transition-all duration-300">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white font-bold text-lg shrink-0 shadow-md">
        #{user.rank}
      </div>
      <Avatar className="h-14 w-14 ring-2 ring-[var(--color-border)]">
        <AvatarImage src={user.avatar_url} alt={user.login} />
        <AvatarFallback>{user.login[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <a
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate text-[var(--color-text-primary)]"
        >
          {user.login}
        </a>
        <div className="flex gap-4 text-sm text-[var(--color-text-tertiary)] mt-1">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            {user.followers.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
            </svg>
            {user.public_repos}
          </span>
        </div>
      </div>
    </div>
  )
}

// 仓库卡片组件
function RepoCard({ repo }: { repo: RepoData }) {
  return (
    <div className="p-4 rounded-lg border bg-[var(--color-bg-card)] border-[var(--color-border)] hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 dark:from-orange-500 dark:to-pink-700 text-white font-bold text-sm shrink-0 shadow-md">
          #{repo.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6 ring-2 ring-[var(--color-border)]">
              <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
              <AvatarFallback className="text-xs">{repo.owner.login[0]}</AvatarFallback>
            </Avatar>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate text-[var(--color-text-primary)]"
            >
              {repo.full_name}
            </a>
          </div>
          {repo.description && (
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3 line-clamp-2">{repo.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {repo.language && (
              <Badge variant="secondary" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {repo.language}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
              ⭐ {repo.stargazers_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
              🔀 {repo.forks_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trending 卡片组件
function TrendingCard({ item }: { item: TrendingData }) {
  return (
    <div className="p-4 rounded-lg border bg-[var(--color-bg-card)] border-[var(--color-border)] hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-600 dark:from-green-500 dark:to-cyan-700 text-white font-bold text-sm shrink-0 shadow-md">
          #{item.rank}
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={item.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate mb-2 text-[var(--color-text-primary)]"
          >
            {item.full_name}
          </a>
          {item.description && (
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3 line-clamp-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {item.language && (
              <Badge variant="secondary" className="gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color || '#6b7280' }}
                ></span>
                {item.language}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
              ⭐ {item.stargazers_count?.toLocaleString() || 0}
            </span>
            {item.todayStar && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 text-white border-0 shadow-md">
                🔥 +{item.todayStar}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
