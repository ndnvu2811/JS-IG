import React, { useState } from 'react';
import { View } from '../types';
import MaterialSymbol from './icons/MaterialSymbol';
import { IoSettingsSharp } from 'react-icons/io5';
import StopAllModal from './StopAllModal';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

interface NavItemProps {
    view: View;
    currentView: View;
    setCurrentView: (view: View) => void;
    icon: string;
    label: string;
    isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  view,
  currentView,
  setCurrentView,
  icon,
  label,
  isCollapsed,
}) => {
  const isActive = currentView === view;
  const activeClasses =
    'bg-primary/10 text-primary dark:bg-primary dark:text-gray-900 font-bold';
  const inactiveClasses =
    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentView(view);
      }}
      className={`flex items-center ${
        isCollapsed ? 'justify-center w-full' : 'gap-3'
      } px-3 py-2 rounded-lg transition-colors ${
        isActive ? activeClasses : inactiveClasses
      }`}
      title={isCollapsed ? label : undefined}
    >
      <MaterialSymbol icon={icon} className={`text-2xl ${isActive ? 'fill' : ''}`} />
      {!isCollapsed && (
        <p className="text-sm font-medium leading-normal">{label}</p>
      )}
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);

    return (
        <aside className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} flex-col border-r border-gray-200 dark:border-border-dark bg-white dark:bg-background-dark ${isCollapsed ? 'p-2' : 'p-4'} transition-all duration-300 h-screen`}>
            <div className="flex h-full flex-col">
                {/* TOP + NAV (scroll được khi danh sách dài) */}
                <div className="mb-1 text-gray-400 hover:text-white">
                    {/* App Branding - JS Instagram */}
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 px-2">
                            <div className="relative">
                                {/* THAY ĐỔI: Bỏ dấu gạch chéo đầu tiên. Nếu file bạn là icon.png, đổi thành "icon.png" */}
                                <img src="icon.ico" alt="JS Instagram" className="size-10 rounded-full object-cover" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                                <h1 className="text-gray-900 dark:text-white text-[16px] font-semibold truncate">JS Instagram</h1>
                            </div>
                            {/* Toggle Button */}
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Collapse sidebar"
                                title="Collapse"
                            >
                                <div className="flex">
                                    <MaterialSymbol icon="chevron_left" className="text-2xl -mr-4" />
                                    <MaterialSymbol icon="chevron_left" className="text-2xl" />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-2 mb-2">
                            <img src="icon.ico" alt="JS Instagram" className="size-10 rounded-full object-cover" />
                            {/* Toggle Button to Expand */}
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
                                aria-label="Expand sidebar"
                                title="Expand"
                            >
                                <MaterialSymbol icon="chevron_right" className="text-2xl" />
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2 mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                        <NavItem view={View.Dashboard} currentView={currentView} setCurrentView={setCurrentView} icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />
                        <NavItem view={View.Calendar} currentView={currentView} setCurrentView={setCurrentView} icon="calendar_month" label="Calendar" isCollapsed={isCollapsed} />
                        <NavItem view={View.Content} currentView={currentView} setCurrentView={setCurrentView} icon="grid_view" label="Content" isCollapsed={isCollapsed} />
                        <NavItem view={View.Reels} currentView={currentView} setCurrentView={setCurrentView} icon="play_circle" label="Reels" isCollapsed={isCollapsed} />
                        <NavItem view={View.Care} currentView={currentView} setCurrentView={setCurrentView} icon="spa" label="Care" isCollapsed={isCollapsed} />
                        <NavItem view={View.Scraper} currentView={currentView} setCurrentView={setCurrentView} icon="content_copy" label="Scraper" isCollapsed={isCollapsed} />
                        <NavItem view={View.ImageEditor} currentView={currentView} setCurrentView={setCurrentView} icon="image_search" label="Image Editor" isCollapsed={isCollapsed} />
                        <NavItem view={View.EditReel} currentView={currentView} setCurrentView={setCurrentView} icon="video_settings" label="Edit Reel" isCollapsed={isCollapsed} />
                        <NavItem view={View.Accounts} currentView={currentView} setCurrentView={setCurrentView} icon="group" label="Accounts" isCollapsed={isCollapsed} />
                        <NavItem view={View.Proxy} currentView={currentView} setCurrentView={setCurrentView} icon="code" label="Proxy" isCollapsed={isCollapsed} />
                        <NavItem view={View.MediaLibrary} currentView={currentView} setCurrentView={setCurrentView} icon="perm_media" label="Media Library" isCollapsed={isCollapsed} />
                        {/* Settings Link */}
                        <a href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentView(View.Settings);
                        }}
                        className={`flex items-center ${
                            isCollapsed ? 'justify-center w-full' : 'gap-3' 
                        } px-3 py-2 rounded-lg transition-colors ${
                            currentView === View.Settings
                            ? 'bg-primary/10 text-primary dark:bg-primary dark:text-gray-900 font-bold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title={isCollapsed ? "Settings" : undefined}
                        >
                        <IoSettingsSharp className='text-2xl' />
                        {!isCollapsed && (
                            <p className="text-sm font-medium leading-normal">
                            Settings
                            </p>
                        )}
                        </a>

                        {/* Stop All (hiển thị như 1 trang/menu item để không bị chìm xuống dưới) */}
                        <button
                          onClick={() => setShowStopModal(true)}
                          className={`flex items-center ${
                            isCollapsed ? 'justify-center w-full' : 'gap-3'
                          } px-3 py-2 rounded-lg transition-colors border border-red-500/50 hover:border-red-500 hover:bg-red-500/10`}
                          title={isCollapsed ? 'Stop All' : undefined}
                          type="button"
                        >
                          <MaterialSymbol icon="stop_circle" className="text-2xl text-red-500" />
                          {!isCollapsed && (
                            <p className="text-sm font-bold leading-normal text-red-500">Stop All</p>
                          )}
                        </button>
                    </nav>
                </div>
            </div>

            {/* Stop All Confirmation Modal */}
            <StopAllModal
                isOpen={showStopModal}
                onConfirm={async () => {
                    setShowStopModal(false);
                    
                    // ✅ FIXED: Call stopAllActivities IPC handler
                    try {
                        const result = await window.electronAPI.stopAllActivities();
                        
                        if (result.success) {
                            console.log(`✅ ${result.message}`);
                            alert(`Success: ${result.message}`);
                        } else {
                            console.error('❌ Stop failed:', result.error);
                            alert(`Failed: ${result.error}`);
                        }
                    } catch (error) {
                        console.error('❌ Stop error:', error);
                        alert(`Error: ${error.message || 'Unknown error'}`);
                    }
                }}
                onCancel={() => setShowStopModal(false)}
            />
        </aside>
    );
};

export default Sidebar;