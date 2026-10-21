'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
interface AnalyticsChartsProps {
  timeSeriesData: { date: string; revenue: number }[];
  topProductsData: { name: string; revenue: number }[];
  categoryChartData: { name: string; revenue: number }[];
  currencyCode: string;
  currencyExponent: number;
}
const colors = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#e11d48', '#0891b2'];
export function AnalyticsCharts({ timeSeriesData, topProductsData, categoryChartData, currencyCode, currencyExponent }: AnalyticsChartsProps) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode });
  const money = (value: number | string) => formatter.format(Number(value) / 10 ** currencyExponent);
  return <div className="grid min-w-0 gap-6 lg:grid-cols-2">
    <section className="min-w-0 rounded-lg border p-4 lg:col-span-2"><h2>Sales · {currencyCode}</h2><div className="h-80">
      <ResponsiveContainer width="100%" height="100%"><AreaChart data={timeSeriesData}><CartesianGrid vertical={false} /><XAxis dataKey="date" /><YAxis tickFormatter={money} /><Tooltip formatter={money} /><Area type="monotone" dataKey="revenue" stroke={colors[0]} fill={colors[0]} fillOpacity={0.12} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
    </div></section>
    <section className="min-w-0 rounded-lg border p-4"><h2>Products · {currencyCode}</h2><div className="h-80">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={topProductsData} layout="vertical"><XAxis type="number" tickFormatter={money} /><YAxis type="category" dataKey="name" width={120} /><Tooltip formatter={money} /><Bar dataKey="revenue" fill={colors[1]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
    </div></section>
    <section className="min-w-0 rounded-lg border p-4"><h2>Categories · {currencyCode}</h2><div className="h-80">
      <ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip formatter={money} /><Pie data={categoryChartData} dataKey="revenue" nameKey="name" innerRadius="45%" isAnimationActive={false}>{categoryChartData.map((entry, i) => <Cell key={entry.name} fill={colors[i % colors.length]} />)}</Pie></PieChart></ResponsiveContainer>
    </div></section>
  </div>;
}
