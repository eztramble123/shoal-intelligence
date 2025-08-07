'use client';

import { useState } from 'react';
import { Search, Filter, Download, TrendingUp, Building, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DataTable, Column } from '@/components/dashboard/data-table';
import { ChartWrapper } from '@/components/dashboard/chart-wrapper';
import { 
  sampleVentureInvestments, 
  VentureInvestment, 
  formatCurrency 
} from '@/lib/sample-data';

interface VentureData {
  investment: VentureInvestment;
  stageOrder: number;
  daysAgo: number;
  formattedDate: string;
  leadInvestor: string;
}

const STAGES = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Strategic'];
const CATEGORIES = ['All', 'Infrastructure', 'Layer 1', 'Layer 2', 'DeFi', 'Gaming', 'AI', 'Data Availability'];

const STAGE_ORDER: Record<string, number> = {
  'Pre-Seed': 1,
  'Seed': 2,
  'Series A': 3,
  'Series B': 4,
  'Series C': 5,
  'Strategic': 6
};

// Mock data for charts
const monthlyFunding = [
  { month: 'Jan', amount: 850 },
  { month: 'Feb', amount: 1200 },
  { month: 'Mar', amount: 980 },
  { month: 'Apr', amount: 430 },
  { month: 'May', amount: 756 },
  { month: 'Jun', amount: 890 }
];

const topInvestors = [
  { name: 'a16z crypto', deals: 12, totalAmount: 485000000 },
  { name: 'Paradigm', deals: 8, totalAmount: 320000000 },
  { name: 'Polychain Capital', deals: 15, totalAmount: 275000000 },
  { name: 'Coinbase Ventures', deals: 18, totalAmount: 180000000 },
  { name: 'Pantera Capital', deals: 22, totalAmount: 165000000 }
];

const categoryDistribution = [
  { category: 'Infrastructure', count: 45, percentage: 32 },
  { category: 'DeFi', count: 28, percentage: 20 },
  { category: 'Layer 1', count: 22, percentage: 16 },
  { category: 'Gaming', count: 18, percentage: 13 },
  { category: 'AI', count: 15, percentage: 11 },
  { category: 'Layer 2', count: 11, percentage: 8 }
];

export default function VentureIntelligence() {
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('30d');

  const processedInvestments: VentureData[] = sampleVentureInvestments.map(investment => {
    const investmentDate = new Date(investment.date);
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      investment,
      stageOrder: STAGE_ORDER[investment.stage] || 0,
      daysAgo,
      formattedDate: investmentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      leadInvestor: investment.investors[0] || 'Unknown'
    };
  });

  const filteredInvestments = processedInvestments.filter(item => {
    const matchesStage = selectedStage === 'All' || item.investment.stage === selectedStage;
    const matchesCategory = selectedCategory === 'All' || item.investment.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.investment.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.investment.investors.some(inv => inv.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStage && matchesCategory && matchesSearch;
  });

  const totalFunding = sampleVentureInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const averageRound = totalFunding / sampleVentureInvestments.length;
  const recentDeals = processedInvestments.filter(p => p.daysAgo <= 30).length;

  const columns: Column<VentureData>[] = [
    {
      key: 'project',
      header: 'Project',
      width: '200px',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)] font-medium flex items-center">
            {item.investment.project}
            <ExternalLink className="dashboard-icon-sm ml-2 text-[var(--dashboard-text-muted)] cursor-pointer" />
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            {item.investment.category}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)] font-semibold">
            {formatCurrency(item.investment.amount)}
          </div>
          {item.investment.valuation && (
            <div className="text-[var(--dashboard-text-secondary)] text-xs">
              {formatCurrency(item.investment.valuation)} valuation
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.investment.stage === 'Seed' ? 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-green)]' :
          item.investment.stage === 'Series A' ? 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-blue)]' :
          item.investment.stage === 'Series B' ? 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-purple)]' :
          'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-orange)]'
        }`}>
          {item.investment.stage}
        </span>
      )
    },
    {
      key: 'leadInvestor',
      header: 'Lead Investor',
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)] font-medium">
            {item.leadInvestor}
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            +{item.investment.investors.length - 1} others
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)]">
            {item.formattedDate}
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            {item.daysAgo} days ago
          </div>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      {/* Key Metrics */}
      <div className="dashboard-grid-4">
        <MetricCard
          label="Total Funding (30d)"
          value={formatCurrency(totalFunding)}
          change={{ value: "+15.2%", type: "positive" }}
          icon={<DollarSign className="dashboard-icon" />}
        />
        <MetricCard
          label="Active Deals"
          value={sampleVentureInvestments.length}
          change={{ value: "+3", type: "positive" }}
          icon={<Building className="dashboard-icon" />}
        />
        <MetricCard
          label="Average Round Size"
          value={formatCurrency(averageRound)}
          change={{ value: "+8.1%", type: "positive" }}
        />
        <MetricCard
          label="Recent Deals (30d)"
          value={recentDeals}
          icon={<Calendar className="dashboard-icon" />}
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid-2">
        {/* Monthly Funding Trend */}
        <ChartWrapper
          title="Monthly Funding Trend"
          subtitle="Funding volume over time"
          height="h-64"
        >
          <div className="flex items-end justify-center h-full space-x-4 p-4">
            {monthlyFunding.map((month) => (
              <div key={month.month} className="flex flex-col items-center">
                <div
                  className="bg-[var(--dashboard-blue)] rounded-t w-8 min-h-4 mb-2"
                  style={{
                    height: `${(month.amount / Math.max(...monthlyFunding.map(m => m.amount))) * 150}px`
                  }}
                />
                <span className="text-xs text-[var(--dashboard-text-secondary)]">{month.month}</span>
                <span className="text-xs text-[var(--dashboard-text-primary)] font-medium">${month.amount}M</span>
              </div>
            ))}
          </div>
        </ChartWrapper>

        {/* Category Distribution */}
        <ChartWrapper
          title="Funding by Category"
          subtitle="Investment distribution across sectors"
          height="h-64"
        >
          <div className="p-4 space-y-3">
            {categoryDistribution.map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                  />
                  <span className="text-[var(--dashboard-text-primary)] text-sm">{cat.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[var(--dashboard-text-secondary)] text-sm">{cat.count}</span>
                  <span className="text-[var(--dashboard-text-primary)] text-sm font-medium">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </ChartWrapper>
      </div>

      {/* Top Investors */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">Top Investors (30 days)</h3>
        </div>
        
        <div className="space-y-4">
          {topInvestors.map((investor, index) => (
            <div key={investor.name} className="flex items-center justify-between p-4 bg-[var(--dashboard-bg)] rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
                  #{index + 1}
                </div>
                <div>
                  <div className="text-[var(--dashboard-text-primary)] font-semibold">
                    {investor.name}
                  </div>
                  <div className="text-[var(--dashboard-text-secondary)] text-sm">
                    {investor.deals} deals
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[var(--dashboard-text-primary)] font-semibold">
                  {formatCurrency(investor.totalAmount)}
                </div>
                <div className="text-[var(--dashboard-text-secondary)] text-sm">
                  {formatCurrency(investor.totalAmount / investor.deals)} avg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Tracker Table */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="dashboard-card-title">Investment Tracker</h3>
            <p className="dashboard-card-subtitle">Recent funding rounds and deals</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="dashboard-btn dashboard-btn-secondary dashboard-btn-sm">
              <Filter className="dashboard-icon-sm mr-1" />
              Filter
            </button>
            <button className="dashboard-btn dashboard-btn-secondary dashboard-btn-sm">
              <Download className="dashboard-icon-sm mr-1" />
              Export
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--dashboard-text-muted)] w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects or investors..."
                className="dashboard-search pl-10 pr-4 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="dashboard-search px-3 py-2 min-w-32"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-[var(--dashboard-text-secondary)] text-sm self-center mr-2">Stage:</span>
            {STAGES.map((stage) => (
              <button
                key={stage}
                className={`dashboard-filter-btn ${
                  selectedStage === stage ? 'selected' : 'default'
                }`}
                onClick={() => setSelectedStage(stage)}
              >
                {stage}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-[var(--dashboard-text-secondary)] text-sm self-center mr-2">Category:</span>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`dashboard-filter-btn ${
                  selectedCategory === category ? 'selected' : 'default'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <DataTable
          data={filteredInvestments}
          columns={columns}
          emptyMessage="No investments match your criteria"
        />
      </div>

      {/* Pipeline Analysis */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="dashboard-card-title">Stage Analysis</h3>
            <p className="dashboard-card-subtitle">Distribution of funding stages</p>
          </div>
        </div>
        
        <div className="dashboard-grid-4">
          {Object.entries(STAGE_ORDER).map(([stage]) => {
            const stageCount = sampleVentureInvestments.filter(inv => inv.stage === stage).length;
            const stageAmount = sampleVentureInvestments
              .filter(inv => inv.stage === stage)
              .reduce((sum, inv) => sum + inv.amount, 0);
            
            return (
              <div key={stage} className="dashboard-metric-card">
                <div className="dashboard-metric-label">{stage}</div>
                <div className="dashboard-metric-value">{stageCount}</div>
                <div className="text-[var(--dashboard-text-secondary)] text-sm">
                  {formatCurrency(stageAmount)} total
                </div>
                <div className="text-[var(--dashboard-text-secondary)] text-xs">
                  {stageAmount > 0 ? formatCurrency(stageAmount / stageCount) : '$0'} avg
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}