import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await forgotPassword({ email });
    setLoading(false);
    if (success) {
      toast.success('Please check your email for reset link/OTP');
      onBack?.();
    } else {
      toast.error('Request failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen background-login">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium mb-4">Forgot Password</h2>
        <input
          type="email"
          className="w-full px-3 py-2 border rounded mb-4 bg-white"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 mb-2"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Submitting...' : 'Send'}
        </button>
        <button className="text-sm text-blue-500" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
