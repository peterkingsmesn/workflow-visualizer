import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { PerformanceMonitor, PerformanceMetrics, PerformanceAlert } from '../../utils/PerformanceMonitor';
import './PerformanceDashboard.css';

// 🚀 성능 최적화: 실시간 성능 대시보드

interface PerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAlerts?: boolean;
  showRecommendations?: boolean;
  timeRange?: number; // milliseconds
  onAlertClick?: (alert: PerformanceAlert) => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000,
  showAlerts = true,
  showRecommendations = true,
  timeRange = 5 * 60 * 1000, // 5분
  onAlertClick
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'memory' | 'render' | 'network' | 'alerts'>('overview');

  // 🚀 성능 최적화: 메트릭 업데이트
  const updateMetrics = useCallback(() => {
    const current = PerformanceMonitor.getCurrentMetrics();
    const history = PerformanceMonitor.getMetricsHistory(timeRange);
    const currentAlerts = PerformanceMonitor.getAlerts();
    
    setCurrentMetrics(current);
    setMetricsHistory(history);
    setAlerts(currentAlerts);
  }, [timeRange]);

  // 🚀 성능 최적화: 모니터링 시작/중지
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      PerformanceMonitor.stop();
      setIsMonitoring(false);
    } else {
      PerformanceMonitor.start();
      setIsMonitoring(true);
    }
  }, [isMonitoring]);

  // 🚀 성능 최적화: 알림 처리
  const handleAlertClick = useCallback((alert: PerformanceAlert) => {
    onAlertClick?.(alert);
  }, [onAlertClick]);

  const resolveAlert = useCallback((alertId: string) => {
    PerformanceMonitor.resolveAlert(alertId);
    updateMetrics();
  }, [updateMetrics]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(updateMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, updateMetrics]);

  // 성능 모니터 이벤트 리스너
  useEffect(() => {
    const handleMetricsUpdate = (metrics: PerformanceMetrics) => {
      setCurrentMetrics(metrics);
    };
    
    const handleAlert = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
    };
    
    PerformanceMonitor.on('metrics-updated', handleMetricsUpdate);
    PerformanceMonitor.on('alert', handleAlert);
    
    return () => {
      PerformanceMonitor.off('metrics-updated', handleMetricsUpdate);
      PerformanceMonitor.off('alert', handleAlert);
    };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    updateMetrics();
    setIsMonitoring(true);
    PerformanceMonitor.start();
    
    return () => {
      PerformanceMonitor.stop();
    };
  }, [updateMetrics]);

  // 🚀 성능 최적화: 계산된 통계
  const statistics = useMemo(() => {
    if (!currentMetrics) return null;
    
    const avgPerformanceScore = metricsHistory.length > 0
      ? metricsHistory.reduce((sum, m) => sum + m.performanceScore, 0) / metricsHistory.length
      : 0;
    
    const memoryTrend = metricsHistory.length > 1
      ? metricsHistory[metricsHistory.length - 1].memoryUsage.usageRatio - metricsHistory[0].memoryUsage.usageRatio
      : 0;
    
    const renderTrend = metricsHistory.length > 1
      ? metricsHistory[metricsHistory.length - 1].renderTime - metricsHistory[0].renderTime
      : 0;
    
    return {
      avgPerformanceScore,
      memoryTrend,
      renderTrend,
      criticalAlerts: alerts.filter(a => a.type === 'error' && !a.resolved).length,
      warningAlerts: alerts.filter(a => a.type === 'warning' && !a.resolved).length
    };
  }, [currentMetrics, metricsHistory, alerts]);

  if (!currentMetrics) {
    return (
      <div className={`performance-dashboard loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>성능 데이터 수집 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-dashboard ${className}`}>
      {/* 헤더 */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>성능 모니터링</h2>
          <div className="monitoring-status">
            <span className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`} />
            <span className="status-text">
              {isMonitoring ? '모니터링 중' : '모니터링 중단'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`btn-toggle ${isMonitoring ? 'stop' : 'start'}`}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? '중지' : '시작'}
          </button>
        </div>
      </div>

      {/* 전체 성능 점수 */}
      <div className="performance-score-card">
        <div className="score-container">
          <div className="score-circle">
            <svg className="score-svg" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--bg-tertiary)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getScoreColor(currentMetrics.performanceScore)}
                strokeWidth="8"
                strokeDasharray={`${currentMetrics.performanceScore * 2.83} 283`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">
              <span className="score-number">{Math.round(currentMetrics.performanceScore)}</span>
              <span className="score-label">점수</span>
            </div>
          </div>
          
          <div className="score-details">
            <div className="score-item">
              <span className="label">평균 점수</span>
              <span className="value">{Math.round(statistics?.avgPerformanceScore || 0)}</span>
            </div>
            <div className="score-item">
              <span className="label">메모리 사용률</span>
              <span className="value">{Math.round(currentMetrics.memoryUsage.usageRatio * 100)}%</span>
            </div>
            <div className="score-item">
              <span className="label">렌더링 시간</span>
              <span className="value">{currentMetrics.renderTime.toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          개요
        </button>
        <button
          className={`tab-btn ${selectedTab === 'memory' ? 'active' : ''}`}
          onClick={() => setSelectedTab('memory')}
        >
          메모리
        </button>
        <button
          className={`tab-btn ${selectedTab === 'render' ? 'active' : ''}`}
          onClick={() => setSelectedTab('render')}
        >
          렌더링
        </button>
        <button
          className={`tab-btn ${selectedTab === 'network' ? 'active' : ''}`}
          onClick={() => setSelectedTab('network')}
        >
          네트워크
        </button>
        <button
          className={`tab-btn ${selectedTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setSelectedTab('alerts')}
        >
          알림 ({alerts.filter(a => !a.resolved).length})
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <OverviewTab 
            metrics={currentMetrics}
            history={metricsHistory}
            statistics={statistics}
          />
        )}
        
        {selectedTab === 'memory' && (
          <MemoryTab 
            metrics={currentMetrics}
            history={metricsHistory}
          />
        )}
        
        {selectedTab === 'render' && (
          <RenderTab 
            metrics={currentMetrics}
            history={metricsHistory}
          />
        )}
        
        {selectedTab === 'network' && (
          <NetworkTab 
            metrics={currentMetrics}
            history={metricsHistory}
          />
        )}
        
        {selectedTab === 'alerts' && (
          <AlertsTab 
            alerts={alerts}
            onAlertClick={handleAlertClick}
            onResolveAlert={resolveAlert}
          />
        )}
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

// 🚀 성능 최적화: 개요 탭 컴포넌트
interface OverviewTabProps {
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
  statistics: any;
}

const OverviewTab: React.FC<OverviewTabProps> = memo(({ metrics, history, statistics }) => (
  <div className="overview-tab">
    <div className="metrics-grid">
      <MetricCard
        title="컴포넌트 수"
        value={metrics.componentCount}
        trend={statistics?.componentTrend}
        icon="🧩"
      />
      <MetricCard
        title="리렌더링 수"
        value={metrics.reRenderCount}
        trend={statistics?.rerenderTrend}
        icon="🔄"
      />
      <MetricCard
        title="네트워크 요청"
        value={metrics.networkRequests.total}
        trend={statistics?.networkTrend}
        icon="🌐"
      />
      <MetricCard
        title="캐시 히트율"
        value={`${Math.round(metrics.cachePerformance.hitRate * 100)}%`}
        trend={statistics?.cacheTrend}
        icon="💾"
      />
    </div>
    
    <div className="chart-container">
      <h3>성능 점수 추이</h3>
      <PerformanceChart data={history} />
    </div>
  </div>
));

OverviewTab.displayName = 'OverviewTab';

// 🚀 성능 최적화: 메모리 탭 컴포넌트
interface MemoryTabProps {
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
}

const MemoryTab: React.FC<MemoryTabProps> = memo(({ metrics, history }) => (
  <div className="memory-tab">
    <div className="memory-overview">
      <div className="memory-gauge">
        <h3>메모리 사용량</h3>
        <div className="gauge-container">
          <div className="gauge-bar">
            <div 
              className="gauge-fill"
              style={{ width: `${metrics.memoryUsage.usageRatio * 100}%` }}
            />
          </div>
          <div className="gauge-labels">
            <span>사용: {formatBytes(metrics.memoryUsage.used)}</span>
            <span>제한: {formatBytes(metrics.memoryUsage.limit)}</span>
          </div>
        </div>
      </div>
      
      <div className="memory-details">
        <div className="detail-item">
          <span className="label">총 힙 크기</span>
          <span className="value">{formatBytes(metrics.memoryUsage.total)}</span>
        </div>
        <div className="detail-item">
          <span className="label">사용률</span>
          <span className="value">{Math.round(metrics.memoryUsage.usageRatio * 100)}%</span>
        </div>
      </div>
    </div>
    
    <div className="memory-chart">
      <h3>메모리 사용량 추이</h3>
      <MemoryChart data={history} />
    </div>
  </div>
));

MemoryTab.displayName = 'MemoryTab';

// 🚀 성능 최적화: 렌더링 탭 컴포넌트
interface RenderTabProps {
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
}

const RenderTab: React.FC<RenderTabProps> = memo(({ metrics, history }) => (
  <div className="render-tab">
    <div className="render-metrics">
      <MetricCard
        title="평균 렌더링 시간"
        value={`${metrics.renderTime.toFixed(1)}ms`}
        icon="⏱️"
      />
      <MetricCard
        title="컴포넌트 수"
        value={metrics.componentCount}
        icon="🧩"
      />
      <MetricCard
        title="리렌더링 수"
        value={metrics.reRenderCount}
        icon="🔄"
      />
    </div>
    
    <div className="render-chart">
      <h3>렌더링 시간 추이</h3>
      <RenderChart data={history} />
    </div>
  </div>
));

RenderTab.displayName = 'RenderTab';

// 🚀 성능 최적화: 네트워크 탭 컴포넌트
interface NetworkTabProps {
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
}

const NetworkTab: React.FC<NetworkTabProps> = memo(({ metrics, history }) => (
  <div className="network-tab">
    <div className="network-metrics">
      <MetricCard
        title="총 요청"
        value={metrics.networkRequests.total}
        icon="🌐"
      />
      <MetricCard
        title="대기 중"
        value={metrics.networkRequests.pending}
        icon="⏳"
      />
      <MetricCard
        title="실패"
        value={metrics.networkRequests.failed}
        icon="❌"
      />
      <MetricCard
        title="평균 응답 시간"
        value={`${Math.round(metrics.networkRequests.avgResponseTime)}ms`}
        icon="⚡"
      />
    </div>
    
    <div className="network-chart">
      <h3>네트워크 응답 시간 추이</h3>
      <NetworkChart data={history} />
    </div>
  </div>
));

NetworkTab.displayName = 'NetworkTab';

// 🚀 성능 최적화: 알림 탭 컴포넌트
interface AlertsTabProps {
  alerts: PerformanceAlert[];
  onAlertClick: (alert: PerformanceAlert) => void;
  onResolveAlert: (alertId: string) => void;
}

const AlertsTab: React.FC<AlertsTabProps> = memo(({ alerts, onAlertClick, onResolveAlert }) => {
  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);
  
  return (
    <div className="alerts-tab">
      <div className="alerts-section">
        <h3>활성 알림 ({activeAlerts.length})</h3>
        <div className="alerts-list">
          {activeAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onClick={() => onAlertClick(alert)}
              onResolve={() => onResolveAlert(alert.id)}
            />
          ))}
          {activeAlerts.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>활성 알림이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="alerts-section">
        <h3>해결된 알림 ({resolvedAlerts.length})</h3>
        <div className="alerts-list resolved">
          {resolvedAlerts.slice(0, 10).map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onClick={() => onAlertClick(alert)}
              resolved
            />
          ))}
        </div>
      </div>
    </div>
  );
});

AlertsTab.displayName = 'AlertsTab';

// 🚀 성능 최적화: 헬퍼 컴포넌트들
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = memo(({ title, value, trend, icon }) => (
  <div className="metric-card">
    <div className="metric-header">
      <span className="metric-icon">{icon}</span>
      <span className="metric-title">{title}</span>
    </div>
    <div className="metric-value">{value}</div>
    {trend !== undefined && (
      <div className={`metric-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'}`}>
        {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend).toFixed(1)}
      </div>
    )}
  </div>
));

MetricCard.displayName = 'MetricCard';

interface AlertItemProps {
  alert: PerformanceAlert;
  onClick: () => void;
  onResolve?: () => void;
  resolved?: boolean;
}

const AlertItem: React.FC<AlertItemProps> = memo(({ alert, onClick, onResolve, resolved }) => (
  <div className={`alert-item ${alert.type} ${resolved ? 'resolved' : ''}`} onClick={onClick}>
    <div className="alert-icon">
      {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
    </div>
    <div className="alert-content">
      <h4 className="alert-title">{alert.title}</h4>
      <p className="alert-message">{alert.message}</p>
      <div className="alert-meta">
        <span className="alert-time">{new Date(alert.timestamp).toLocaleString()}</span>
        <span className="alert-category">{alert.category}</span>
      </div>
    </div>
    {!resolved && onResolve && (
      <button 
        className="alert-resolve"
        onClick={(e) => {
          e.stopPropagation();
          onResolve();
        }}
      >
        해결
      </button>
    )}
  </div>
));

AlertItem.displayName = 'AlertItem';

// 🚀 성능 최적화: 차트 컴포넌트들 (간단한 구현)
const PerformanceChart: React.FC<{ data: PerformanceMetrics[] }> = memo(({ data }) => (
  <div className="simple-chart">
    <div className="chart-line">
      {data.map((metric, index) => (
        <div
          key={index}
          className="chart-point"
          style={{ 
            left: `${(index / (data.length - 1)) * 100}%`,
            bottom: `${metric.performanceScore}%`
          }}
        />
      ))}
    </div>
  </div>
));

const MemoryChart: React.FC<{ data: PerformanceMetrics[] }> = memo(({ data }) => (
  <div className="simple-chart">
    <div className="chart-line">
      {data.map((metric, index) => (
        <div
          key={index}
          className="chart-point"
          style={{ 
            left: `${(index / (data.length - 1)) * 100}%`,
            bottom: `${metric.memoryUsage.usageRatio * 100}%`
          }}
        />
      ))}
    </div>
  </div>
));

const RenderChart: React.FC<{ data: PerformanceMetrics[] }> = memo(({ data }) => (
  <div className="simple-chart">
    <div className="chart-line">
      {data.map((metric, index) => (
        <div
          key={index}
          className="chart-point"
          style={{ 
            left: `${(index / (data.length - 1)) * 100}%`,
            bottom: `${Math.min(metric.renderTime / 50 * 100, 100)}%`
          }}
        />
      ))}
    </div>
  </div>
));

const NetworkChart: React.FC<{ data: PerformanceMetrics[] }> = memo(({ data }) => (
  <div className="simple-chart">
    <div className="chart-line">
      {data.map((metric, index) => (
        <div
          key={index}
          className="chart-point"
          style={{ 
            left: `${(index / (data.length - 1)) * 100}%`,
            bottom: `${Math.min(metric.networkRequests.avgResponseTime / 5000 * 100, 100)}%`
          }}
        />
      ))}
    </div>
  </div>
));

// 🚀 성능 최적화: 유틸리티 함수들
function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--success-color, #10b981)';
  if (score >= 60) return 'var(--warning-color, #f59e0b)';
  return 'var(--error-color, #ef4444)';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default PerformanceDashboard;