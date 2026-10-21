import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wind, 
  Compass, 
  LineChart, 
  History, 
  Cpu, 
  Settings,
  ShieldAlert,
  ChevronRight,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/cyclones', label: 'Live Cyclones', icon: Wind, badge: '4' },
  { to: '/predictions', label: 'Track Prediction', icon: Compass },
  { to: '/analysis', label: 'Cyclone Analysis', icon: LineChart },
  { to: '/historical', label: 'Historical Data', icon: History },
  { to: '/performance', label: 'Model Performance', icon: Cpu },
  { to: '/updates', label: 'Prediction Updates', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-wider text-slate-100">VORTI<span className="text-cyan-400">CAST</span></span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-cyan-500 font-semibold">AI Cyclone Intel</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Monitoring
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400 pl-2.5 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 flex-shrink-0 group-hover:text-cyan-400 transition-colors" />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* System Status in Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/50">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <div className="text-xs">
              <p className="font-medium text-slate-200">NeuralTrack GNN</p>
              <p className="text-[11px] text-slate-500">Inference: 18ms / lead cycle</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
