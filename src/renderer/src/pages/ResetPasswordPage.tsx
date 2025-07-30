import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

interface ResetPasswordPageProps {
  onBack?: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBack }) => {
  const { newPassword } = useAuth();
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await newPassword({ Email, Password });
    setLoading(false);
    if (success) {
      toast.success('Password updated');
      onBack?.();
    } else {
      toast.error('Update failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen background-login">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium mb-4">Reset Password</h2>
        <input
          type="email"
          className="w-full px-3 py-2 border rounded mb-3 bg-white"
          placeholder="Email"
          value={Email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-3 py-2 border rounded mb-4 bg-white"
          placeholder="New Password"
          value={Password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 mb-2"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
        <button
          type="button"
          className="text-sm text-blue-500"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
