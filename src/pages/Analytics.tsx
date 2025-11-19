import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useML } from "@/context/MLContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import ExportReports from "@/components/ExportReports";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent-foreground))", "hsl(var(--secondary-foreground))", "hsl(var(--muted-foreground))"]; // use theme colors

function dateKey(ts: string) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

const AnalyticsPage: React.FC = () => {
  const { dataset, loadSampleDataset } = useML();

  useEffect(() => {
    document.title = "Analytics | UPI Fraud Detection";
  }, []);

  const fraudPerDay = useMemo(() => {
    const map = new Map<string, number>();
    dataset.filter(r => r.FraudLabel === 1).forEach(r => {
      const k = dateKey(r.Timestamp);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [dataset]);

  const fraudByType = useMemo(() => {
    const map = new Map<string, number>();
    dataset.filter(r => r.FraudLabel === 1).forEach(r => {
      const k = r.TransactionType;
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([type, value]) => ({ name: type, value }));
  }, [dataset]);

  const volumeOverTime = useMemo(() => {
    const map = new Map<string, number>();
    dataset.forEach(r => {
      const k = dateKey(r.Timestamp);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
  }, [dataset]);

  return (
    <div className="grid gap-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-variant flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">Real-time insights into fraud detection patterns</p>
            </div>
          </div>
          
          {dataset.length > 0 && (
            <ExportReports
              data={dataset}
              title="Analytics Dashboard"
            />
          )}
        </div>
        
        {dataset.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{dataset.length.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
              </div>
            </div>
            <div className="surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {dataset.filter(r => r.FraudLabel === 1).length.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Fraud Cases</p>
                </div>
              </div>
            </div>
            <div className="surface-elevated p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">
                    {((1 - dataset.filter(r => r.FraudLabel === 1).length / dataset.length) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Detection Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {dataset.length === 0 && (
        <Card className="surface-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Load a dataset to start exploring fraud patterns and analytics insights.
            </p>
            <Button onClick={loadSampleDataset} className="btn-hero">
              Load Sample Dataset
            </Button>
          </CardContent>
        </Card>
      )}

      {dataset.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card className="surface-elevated">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">📊</span>
                Fraud Count per Day
              </CardTitle>
              <ExportReports
                data={fraudPerDay}
                title="Fraud Count per Day"
                variant="icon"
                chartId="fraud-per-day-chart"
              />
            </CardHeader>
            <CardContent className="h-80" id="fraud-per-day-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fraudPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px hsl(var(--primary) / 0.15)'
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-sm">🥧</span>
                Fraud by Transaction Type
              </CardTitle>
              <ExportReports
                data={fraudByType}
                title="Fraud by Transaction Type"
                variant="icon"
                chartId="fraud-by-type-chart"
              />
            </CardHeader>
            <CardContent className="h-80" id="fraud-by-type-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={fraudByType} 
                    dataKey="value" 
                    nameKey="name" 
                    outerRadius={100} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {fraudByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 surface-elevated">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-sm">📈</span>
                Transaction Volume Over Time
              </CardTitle>
              <ExportReports
                data={volumeOverTime}
                title="Transaction Volume Over Time"
                variant="icon"
                chartId="volume-over-time-chart"
              />
            </CardHeader>
            <CardContent className="h-80" id="volume-over-time-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px hsl(var(--primary) / 0.15)'
                    }} 
                  />
                  <Line 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
