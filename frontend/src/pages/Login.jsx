import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (user.role === 'HOD') navigate('/hod');
            else if (user.role === 'Coordinator') navigate('/coordinator');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">🎓</div>
                    <h1 className="login-title">LeaveSync</h1>
                    <p className="login-subtitle">Digital Leave Management System</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="login-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            required
                            className="form-control"
                            placeholder="yourname@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            required
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }}>
                        🚀 Sign In to Dashboard
                    </button>
                </form>

                <div className="login-link">
                    First time setup? <a href="/register-hod">Register as HOD →</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
