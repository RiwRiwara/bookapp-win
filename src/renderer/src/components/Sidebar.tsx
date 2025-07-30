import React from 'react';
import { IoPersonCircle, IoSettings } from 'react-icons/io5';
import { CiLogout } from 'react-icons/ci';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import bookicon from '../assets/bookicon.png';
import hearticon from '../assets/hearticon.png';
import cloudicon from '../assets/cloudicon.png';
import logo from '../assets/logo.png';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { logout } = useAuth();
  const { user } = useUser();
  return (
    <div className="h-full w-64 bg-white  flex flex-col justify-between ">
      <div>
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full  flex flex-col items-center justify-center ">
            <img src={logo} alt="เมนูหลัก" className="" style={{ width: '100px', height: '100px' }} />
          </div>
        </div>
        <div className="border-t border-gray-100 my-3" />
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            <li>
              <button
                className={`w-full flex items-center px-4 py-2 rounded ${currentPage === 'library' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => onNavigate('library')}
              >
                <img src={bookicon} alt="ค้นหนังสือ" className="w-6 h-6 mr-2" />
                ชั้นหนังสือ
              </button>
            </li>
            <li>
              <button
                className={`w-full flex items-center px-4 py-2 rounded ${currentPage === 'mylist' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => onNavigate('mylist')}
              >
                <img
                  src={hearticon}
                  alt="ลิสต์ของฉัน"
                  className="w-6 h-6 mr-2"
                />
                ลิสต์ของฉัน
              </button>
            </li>
            <li>
              <button
                className={`w-full flex items-center px-4 py-2 rounded ${currentPage === 'mycloud' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => onNavigate('mycloud')}
              >
                <img src={cloudicon} alt="มายคลาวด์" className="w-6 h-6 mr-2" />
                มายคลาวด์
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="px-4 pb-6 flex flex-col items-center">
        <button
          className="w-full flex items-center px-4 py-2 rounded hover:bg-gray-100 mt-2 text-gray-500 border-t border-gray-200 gap-2"
          onClick={() => onNavigate('setting')}
        >
          <IoSettings className="text-gray-500 w-8 h-8" /> การตั้งค่า
        </button>

        <button
          className="w-full flex items-center px-4 py-2 rounded hover:bg-gray-100 mt-2 text-gray-500 border-t border-gray-200 gap-2"
          onClick={logout}
        >
          <CiLogout className="text-gray-500 w-8 h-8" /> ออกจากระบบ
        </button>

        <a
          className="flex flex-row items-center mt-4 gap-2 cursor-pointer"
          onClick={() => onNavigate('profile')}
        >
          <IoPersonCircle className="text-gray-400 w-8 h-8" />
          <div className="flex flex-col  text-xs">
            <div>{user?.name ?? 'Guest'}</div>
            <div>{user?.email ?? ''}</div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
