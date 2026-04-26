import { useSniper } from './hooks/useSniper';
import { ModeSwitcher } from './components/ModeSwitcher';
import { PlanSelector } from './components/PlanSelector';
import { TimerConfig } from './components/TimerConfig';
import { AuthPanel } from './components/AuthPanel';
import { StockMonitor } from './components/StockMonitor';
import { LogConsole } from './components/LogConsole';
import { ControlBar } from './components/ControlBar';
import { QuickGuide } from './components/QuickGuide';
import { PLANS } from './lib/config';

function App() {
  const sniper = useSniper();
  const isRunning = sniper.status === 'running' || sniper.status === 'countdown';
  const isBusy = isRunning || sniper.isMonitoring;
  const canStart = sniper.mode === 'api' ? !!sniper.authToken : !!sniper.cookies;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'url(/images/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, hsl(160 84% 44%), transparent 70%)' }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                GLM Sniper
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Coding Plan 抢购工具 · v1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-primary animate-pulse-glow' : 'bg-muted-foreground/40'
              }`} />
              {isRunning ? '运行中' : '待命'}
            </div>
            <a
              href="https://open.bigmodel.cn/glm-coding"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              前往官网
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
          {/* Left panel - Config */}
          <div className="space-y-4">
            {/* Mode & Plan */}
            <div className="rounded-lg border border-border bg-card/80 p-4 space-y-4 backdrop-blur-sm card-hover">
              <ModeSwitcher
                mode={sniper.mode}
                onModeChange={sniper.setMode}
                disabled={isRunning}
              />
              <PlanSelector
                plan={sniper.plan}
                onPlanChange={sniper.setPlan}
                disabled={isRunning}
              />
            </div>

            {/* Timer */}
            <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm card-hover">
              <TimerConfig
                targetDate={sniper.targetDate}
                targetTime={sniper.targetTime}
                onDateChange={sniper.setTargetDate}
                onTimeChange={sniper.setTargetTime}
                disabled={isBusy}
              />
            </div>

            {/* Stock Monitor */}
            <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm card-hover">
              <StockMonitor
                stockStatus={sniper.stockStatus}
                isMonitoring={sniper.isMonitoring}
                plan={sniper.plan}
                onStartMonitoring={sniper.startMonitoring}
                onStopMonitoring={sniper.stopMonitoring}
                onCheckStock={sniper.checkStock}
                disabled={isRunning}
              />
            </div>

            {/* Auth */}
            <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm card-hover">
              <AuthPanel
                authToken={sniper.authToken}
                onTokenChange={sniper.setAuthToken}
                cookies={sniper.cookies}
                onCookiesChange={sniper.setCookies}
                disabled={isBusy}
                onLog={sniper.addLog}
              />
            </div>
          </div>

          {/* Right panel - Logs & Guide */}
          <div className="space-y-4">
            {/* Target info banner */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">抢购目标</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                      GLM Coding Plan {PLANS[sniper.plan].name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {PLANS[sniper.plan].price}
                    </span>
                    {PLANS[sniper.plan].badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                        {PLANS[sniper.plan].badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-0.5">模式</div>
                  <span className="text-sm font-medium text-foreground">
                    {sniper.mode === 'browser' ? '🌐 浏览器自动化' : '⚡ API 高速'}
                  </span>
                </div>
              </div>
            </div>

            {/* Log console */}
            <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm flex flex-col" style={{ minHeight: '360px' }}>
              <LogConsole
                logs={sniper.logs}
                onClear={sniper.clearLogs}
              />
            </div>

            {/* Quick guide */}
            <QuickGuide mode={sniper.mode} plan={sniper.plan} />

            {/* Control bar */}
            <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
              <ControlBar
                status={sniper.status}
                onStart={sniper.start}
                onStop={sniper.stop}
                disabled={!canStart}
              />
              {!canStart && (
                <p className="text-[10px] text-warning mt-2">
                  ⚠ 请先配置 {sniper.mode === 'api' ? 'Auth Token' : 'Cookies'} 才能启动抢购
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-[10px] text-muted-foreground/40">
          GLM Sniper · 仅供学习研究使用 · 请遵守智谱AI用户协议
        </footer>
      </div>
    </div>
  );
}

export default App;
