"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HourlyChartPoint = {
  label: string;
  temperature: number;
  rainChance: number;
};

type HourlyChartProps = {
  data: HourlyChartPoint[];
  temperatureUnit: string;
};

export function HourlyChart({ data, temperatureUnit }: HourlyChartProps) {
  return (
    <div className="glass-card rounded-[28px] p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-ink/55">Hourly Outlook</p>
          <h2 className="text-2xl font-semibold">Temperature and Rain Trend</h2>
        </div>
        <div className="rounded-full bg-white/70 px-4 py-2 text-sm text-ink/70">
          Next 24 hours
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7bc2ff" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#7bc2ff" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(17,34,57,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "#4b5d77", fontSize: 12 }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#4b5d77", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "#4b5d77", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(17,34,57,0.08)",
                background: "rgba(255,255,255,0.96)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "temperature") {
                  return [`${value}${temperatureUnit}`, "Temperature"];
                }
                return [`${value}%`, "Rain chance"];
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#1e88e5"
              strokeWidth={3}
              fill="url(#tempFill)"
              activeDot={{ r: 5 }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="rainChance"
              stroke="#ff8a5b"
              strokeWidth={2}
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
