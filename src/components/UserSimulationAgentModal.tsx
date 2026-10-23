import React, { useState } from 'react';
import {
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Cpu,
  Clock,
  X,
  FileCheck,
} from 'lucide-react';
import { Match, FilterRule, UserProfile, AgentSimulationResult, AgentSimulationStep } from '../types';
import { runUserSimulationAgent } from '../services/userSimulationAgent';

interface UserSimulationAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  matches: Match[];
  filters: FilterRule[];
}

export const UserSimulationAgentModal: React.FC<UserSimulationAgentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  matches,
  filters,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(currentUser);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<AgentSimulationStep | null>(null);
  const [result, setResult] = useState<AgentSimulationResult | null>(null);

  if (!isOpen) return null;

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setProgress(5);
    setResult(null);

    try {
      const res = await runUserSimulationAgent({
        user: selectedUser,
        matches,
        filters,
        onStepUpdate: (step, pct) => {
          setCurrentStep(step);
          setProgress(pct);
        },
      });
      setResult(res);
      setProgress(100);
    } catch (e: any) {
      console.error('Agent simulation error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setProgress(0);
    setCurrentStep(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  ИИ-Агент Тестировщик (User Simulation)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Имитирует действия реального пользователя, проверяя фильтры, телеметрию и сигналы без влияния на боевые данные.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Persona selector & Sandbox badge */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Тестировать от лица роли / пользователя:
                </label>
                <div className="flex flex-wrap gap-2">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setSelectedUser(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                        selectedUser.id === u.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span>{u.name}</span>
                      <span className="text-[10px] opacity-80 font-mono">({u.plan})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-mono">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>0% Side Effects</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Агент работает в изолированной виртуальной среде: он не перезаписывает ваши сохраненные фильтры, не отправляет спам в боевые Telegram-каналы и не загрязняет журнал сигналов.
            </p>
          </div>

          {/* Action Trigger Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">{matches.length}</span> матчей в потоке,{' '}
              <span className="font-bold text-white">{filters.length}</span> алгоритмов готово к тесту.
            </div>

            <div className="flex items-center gap-2">
              {result && !isRunning && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Сброс</span>
                </button>
              )}

              <button
                type="button"
                disabled={isRunning}
                onClick={handleStartSimulation}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-950/50 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Идёт тестирование ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Запустить Агента</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {(isRunning || result) && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  {isRunning ? 'Диагностика в процессе...' : 'Диагностика завершена'}
                </span>
                <span className="font-mono font-bold text-emerald-400">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Test Steps Execution List */}
          {(isRunning || result) && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Журнал проверок агента</span>
              </h4>

              <div className="space-y-2">
                {(result?.steps || (currentStep ? [currentStep] : [])).map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3 animate-in fade-in duration-150"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {st.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        {st.status === 'warning' && (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                        {st.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        {st.status === 'running' && (
                          <Activity className="h-4 w-4 text-cyan-400 animate-spin" />
                        )}
                        {st.status === 'pending' && (
                          <Clock className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200">{st.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {st.details}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {st.metric && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {st.metric}
                        </span>
                      )}
                      {st.durationMs > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          {st.durationMs} мс
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Results Card */}
          {result && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/40 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">Итоговый отчёт агента</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Здоровье: {result.healthScore}%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Матчей проверено</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.testedMatchesCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Фильтров в тесте</div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.testedFiltersCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Сигналов в песочнице</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{result.signalsGeneratedInSandbox}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Время теста</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{result.totalDurationMs} мс</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Песочница изолирована от рабочего хранилища и Telegram</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
