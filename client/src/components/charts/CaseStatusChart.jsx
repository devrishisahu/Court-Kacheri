import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = { open: '#ffffff', closed: '#555555' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 font-['Inter']">
        <p className="text-white text-sm font-semibold capitalize">{payload[0].name}</p>
        <p className="text-[#a0a0a0] text-xs mt-1">{payload[0].value} cases</p>
      </div>
    );
  }
  return null;
};

export default function CaseStatusChart({ open = 0, closed = 0 }) {
  const data = [
    { name: 'Open', value: open },
    { name: 'Closed', value: closed },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#555555] text-sm font-['Inter']">
        No case data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()] || '#a0a0a0'} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
