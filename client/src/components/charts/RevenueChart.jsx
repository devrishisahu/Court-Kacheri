import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
  paid: '#4ade80',
  sent: '#60a5fa',
  draft: '#a0a0a0',
  overdue: '#f87171',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 font-['Inter']">
        <p className="text-white text-sm font-semibold capitalize">{label}</p>
        <p className="text-[#a0a0a0] text-xs mt-1">
          ₹{payload[0].value?.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data = {} }) {
  const chartData = Object.entries(data).map(([status, info]) => ({
    status,
    total: info.total || 0,
    count: info.count || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555555] text-sm font-['Inter']">
        No billing data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barCategoryGap="20%">
        <XAxis
          dataKey="status"
          tick={{ fill: '#a0a0a0', fontSize: 12, fontFamily: 'Inter' }}
          axisLine={{ stroke: '#2a2a2a' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#555555', fontSize: 11, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#a0a0a0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
