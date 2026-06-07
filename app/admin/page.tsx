"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsData, ApiResponse } from "@/types";

const CHART_COLORS = ["#c9a10e", "#e2b91a", "#a07d09", "#057848", "#12b96c", "#664c10"];

const tooltipStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid rgba(201, 161, 14, 0.3)",
  borderRadius: "6px",
  color: "#fdfae9",
};

export default function AdminDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      const json: ApiResponse<AnalyticsData> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data!;
    },
  });

  const stats = analytics
    ? [
        {
          label: "Total Revenue",
          value: formatPrice(analytics.totalRevenue),
          icon: DollarSign,
        },
        {
          label: "Total Orders",
          value: analytics.totalOrders.toLocaleString(),
          icon: ShoppingCart,
        },
        {
          label: "Customers",
          value: analytics.totalCustomers.toLocaleString(),
          icon: Users,
        },
        {
          label: "Active Products",
          value: analytics.totalProducts.toLocaleString(),
          icon: Package,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">Analytics Dashboard</h1>
        <p className="mt-1 font-body text-obsidian-400">Overview of store performance</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-obsidian-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/10">
                    <Icon className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-body text-sm text-obsidian-400">{label}</p>
                    <p className="font-heading text-2xl text-ivory-100">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.revenueByMonth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="month" stroke="#7a7a7a" fontSize={12} />
                      <YAxis stroke="#7a7a7a" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [formatPrice(value), "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#c9a10e"
                        strokeWidth={2}
                        dot={{ fill: "#c9a10e", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.ordersByStatus ?? []}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {(analytics?.ordersByStatus ?? []).map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.topProducts ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis type="number" stroke="#7a7a7a" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#7a7a7a"
                      fontSize={11}
                      width={120}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="sales" fill="#c9a10e" radius={[0, 4, 4, 0]} name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
