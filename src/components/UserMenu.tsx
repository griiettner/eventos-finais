import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, ChevronDown, Edit, UserIcon, HelpCircle, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface UserMenuProps {
  onProfileUpdate?: (userData: { username: string; email: string }) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      setEditUsername(user.username);
    }
  }, [user]);

  const handleProfileUpdate = () => {
    if (user && editUsername.trim()) {
      onProfileUpdate?.({
        username: editUsername.trim(),
        email: user.email
      });
      setIsEditingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className='relative'>
      <div className='user-info' onClick={() => setIsOpen(!isOpen)} role='button'>
        <div className='avatar'>
          <Menu size={20} />
        </div>
        <div>
          <h3>Olá, {user?.username} {user.isAdmin ? '(Admin)' : ''}</h3>
          <p>Menu de usuário</p>
        </div>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className='dropdown-menu glass'
          >
            {/* User Info */}
            <div className='dropdown-header'>
              <div className='user-profile'>
                <div className='profile-avatar'>
                  <UserIcon size={20} />
                </div>
                <div className='profile-details'>
                  {isEditingProfile ? (
                    <div className='edit-profile'>
                      <input
                        type='text'
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className='edit-input'
                        placeholder='Display name'
                      />
                      <div className='edit-buttons'>
                        <button onClick={handleProfileUpdate} className='save-btn btn-primary'>
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setEditUsername(user.username);
                          }}
                          className='cancel-btn'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className='profile-info'>
                      <div className='username'>{user.username}</div>
                      <div className='email'>{user.email}</div>
                    </div>
                  )}
                </div>
              </div>
              {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className='edit-profile-btn'>
                  <Edit size={12} />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Menu Items */}
            <div className='menu-items'>
              {/* Help Link */}
              <button
                onClick={() => {
                  navigate('/help');
                  setIsOpen(false);
                }}
                className='menu-item'
              >
                <HelpCircle size={16} />
                Como usar o App
              </button>

              {/* Admin Link for admin users */}
              {user.isAdmin && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setIsOpen(false);
                  }}
                  className='menu-item admin-item'
                >
                  <Shield size={16} />
                  Admin Dashboard
                </button>
              )}

              {/* Logout */}
              <button onClick={handleLogout} className='menu-item logout-item'>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
