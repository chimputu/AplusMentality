'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileCheck,
  Building2,
  UserPlus,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Stats {
  totalUsers: number;
  usersByRole: { role: string; _count: { role: number } }[];
  totalInstitutions: number;
  totalCourses: number;
  totalEnrollments: number;
  totalAssessments: number;
}

interface ChartDataPoint {
  date: string;
  users?: number;
  enrollments?: number;
}

interface TopCourseData {
  name: string;
  enrollments: number;
}

const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  yellow: '#eab308',
  red: '#ef4444',
  indigo: '#6366f1',
  pink: '#ec4899',
  orange: '#f97316',
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<ChartDataPoint[]>([]);
  const [enrollmentActivity, setEnrollmentActivity] = useState<ChartDataPoint[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setUserGrowth(data.userGrowth || []);
        setEnrollmentActivity(data.enrollmentActivity || []);
        setTopCourses(data.topCourses || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Institutions', value: stats?.totalInstitutions || 0, icon: Building2, color: 'text-green-600' },
    { label: 'Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-purple-600' },
    { label: 'Enrollments', value: stats?.totalEnrollments || 0, icon: GraduationCap, color: 'text-yellow-600' },
    { label: 'Assessments', value: stats?.totalAssessments || 0, icon: FileCheck, color: 'text-red-600' },
    { label: 'New Users (Recent)', value: recentUsers.length, icon: UserPlus, color: 'text-indigo-600' },
  ];

  // Role distribution data for PieChart
  const roleDistribution = (stats?.usersByRole || []).map((item) => ({
    name: item.role,
    value: item._count.role,
  }));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Analytics</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Platform statistics and user activity overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Line Chart: User Growth */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            User Growth (7 Days)
          </h2>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.blue, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">
              No user growth data available
            </div>
          )}
        </div>

        {/* Bar Chart: Top Courses */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Top Courses by Enrollment
          </h2>
          {topCourses.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCourses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                  }}
                />
                <Legend />
                <Bar dataKey="enrollments" name="Enrollments" radius={[4, 4, 0, 0]}>
                  {topCourses.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">
              No course enrollment data available
            </div>
          )}
        </div>

        {/* Pie Chart: Role Distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            Role Distribution
          </h2>
          {roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">
              No role distribution data available
            </div>
          )}
        </div>

        {/* Area Chart: Daily Enrollment Activity */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Daily Enrollment Activity (7 Days)
          </h2>
          {enrollmentActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollmentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="enrollments"
                  name="Enrollments"
                  stroke={CHART_COLORS.orange}
                  fill={CHART_COLORS.orange}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">
              No enrollment activity data available
            </div>
          )}
        </div>
      </div>

      {/* Users by Role */}
      {stats?.usersByRole && stats.usersByRole.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Users by Role
          </h2>
          <div className="space-y-3">
            {stats.usersByRole.map(({ role, _count }) => {
              const percentage = stats.totalUsers
                ? Math.round((_count.role / stats.totalUsers) * 100)
                : 0;
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {role}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {_count.role} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Users */}
      {recentUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Role
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Institution
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {user.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {user.institution?.shortName || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
