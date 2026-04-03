import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RegisterHOD = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register-hod', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="login-page" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #c026d3 100%)' }}>
            <div className="login-card">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #c026d3)' }}>🏛️</div>
                    <h1 className="login-title">HOD Initial Setup</h1>
                    <p className="login-subtitle">Register the Head of Department account</p>
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
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            required
                            className="form-control"
                            placeholder="Dr. Firstname Lastname"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            required
                            className="form-control"
                            placeholder="hod@college.edu"
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
                    <button
                        type="submit"
                        className="btn btn-purple btn-full"
                        style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                    >
                        🏛️ Register as HOD
                    </button>
                </form>

                <div className="login-link">
                    Already have an account? <a href="/login">← Back to Login</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterHOD;
