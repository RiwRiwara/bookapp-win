import { useUser } from '../context/UserContext';

const ProfilePage: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="flex-1 p-8 text-gray-700">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mb-4 flex items-center justify-center text-white text-3xl">
          <span className="material-icons">person</span>
        </div>
        <div className="w-full max-w-md">
          <label className="block text-left text-sm font-medium mb-1">
            Nickname
          </label>
          <div className="flex flex-col items-center">
            <div>{user?.name}</div>
            <div>{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
