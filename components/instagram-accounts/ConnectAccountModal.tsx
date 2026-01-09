import React, { useState, useEffect } from 'react';
import { AccountStatus } from '../../types';

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (accountData: any) => void;
}

const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  onConnect,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Setup listeners khi modal mở
    const handleStatus = (data: { status: string; message: string }) => {
      setStatusMessage(data.message);
    };

    const handleSuccess = (data: any) => {
      console.log('✅ Received login success from Electron:', data);
      console.log('   Username:', data.username);
      console.log('   Avatar:', data.avatar);
      console.log('   Followers:', data.followers);
      console.log('   Following:', data.following);
      console.log('   Posts:', data.posts);
      
      setIsLoading(false);
      setStatusMessage('');
      
      // Tạo object account - sử dụng accountId từ main.js (đã tạo khi đăng nhập)
      const newAccount: any = {
        id: data.accountId,  // ✅ FIX: Sử dụng accountId từ main.js thay vì tạo ID mới
        username: data.username,
        avatarUrl: data.avatar || '',
        followers: String(data.followers || 0),
        following: String(data.following || 0),
        posts: String(data.posts || 0),
        status: AccountStatus.Connected,
        cookiesPath: data.cookiesPath,
        sessionId: data.sessionId,
        cookies: data.cookies,
      };
      
      console.log('📦 New account object created:', newAccount);
      
      // Gọi callback để thêm vào danh sách
      onConnect(newAccount);
      
      // Reset form và đóng modal
      resetForm();
      onClose();
    };

    const handleError = (data: { error: string }) => {
      console.error('❌ Nhận lỗi:', data.error);
      setIsLoading(false);
      setStatusMessage('');
      setErrorMessage(data.error);
    };

    // Đăng ký listeners
    window.electronAPI.onLoginStatus(handleStatus);
    window.electronAPI.onLoginSuccess(handleSuccess);
    window.electronAPI.onLoginError(handleError);

    // Cleanup khi modal đóng
    return () => {
      window.electronAPI.removeAllListeners();
    };
  }, [isOpen, onConnect, onClose]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setStatusMessage('');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username và Password không được để trống!');
      return;
    }
    
    // Reset error
    setErrorMessage('');
    setIsLoading(true);
    
    // Gửi yêu cầu đăng nhập qua IPC (KHÔNG CÓ PROXY)
    console.log('📤 Gửi yêu cầu đăng nhập:', username);
    window.electronAPI.loginInstagram(username.trim(), password, undefined);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Connect Instagram Account
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_instagram_username"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {statusMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectAccountModal;