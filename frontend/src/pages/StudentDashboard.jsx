import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { generateLeavePDF } from '../utils/pdfGenerator';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [isApplying, setIsApplying] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);

    // Form state
    const [type, setType] = useState('Medical');
    const [content, setContent] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leaves/my-leaves');
            setLeaves(data);
        } catch (error) {
            console.error('Failed to fetch leaves', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLeave) {
                await api.put(`/leaves/${editingLeave._id}`, { type, content });
            } else {
                await api.post('/leaves', { type, content });
            }
            setIsApplying(false);
            setEditingLeave(null);
            setContent('');
            setAiPrompt('');
            setType('Medical');
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving leave');
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) {
            alert('Please enter a short reason for your leave first.');
            return;
        }
        setIsGenerating(true);
        try {
            const { data } = await api.post('/leaves/generate', { prompt: aiPrompt });
            setContent(data.content);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate AI content');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = (leave) => {
        setEditingLeave(leave);
        setType(leave.type);
        setContent(leave.content);
        setIsApplying(true);
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
        try {
            await api.delete(`/leaves/${id}`);
            fetchLeaves();
        } catch (error) {
            alert('Failed to cancel leave');
        }
    };

    const downloadPDF = (leave) => {
        const leaveWithStudent = { ...leave, studentId: { name: user.name, email: user.email } };
        generateLeavePDF(leaveWithStudent);
    };

    // Helper for stats
    const counts = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
        forwarded: leaves.filter(l => l.status === 'Forwarded').length,
    };

    const getTypeBadgeClass = (t) =>
        t === 'Important' ? 'badge badge-important' :
        t === 'Medical' ? 'badge badge-medical' :
        'badge badge-less';

    const getStatusBadgeClass = (s) =>
        s === 'Pending' ? 'badge badge-pending' :
        s === 'Forwarded' ? 'badge badge-forwarded' :
        s === 'Approved' ? 'badge badge-approved' :
        'badge badge-rejected';

    const getLeaveCardClass = (t) =>
        t === 'Important' ? 'leave-card important' :
        t === 'Medical' ? 'leave-card medical' :
        'leave-card less-important';

    return (
        <div className="page-bg">
            {/* Header */}
            <header className="college-header">
                <div className="college-header-inner">
                    <div className="college-logo-area">
                        <div className="college-logo-icon">🎓</div>
                        <div className="college-logo-text">
                            <span className="app-title">LeaveSync</span>
                            <span className="app-subtitle">Student Portal</span>
                        </div>
                    </div>
                    <div className="header-user-area">
                        <div className="user-chip">
                            <div className="user-avatar">{user.name?.[0]}</div>
                            <span className="user-name">{user.name}</span>
                        </div>
                        <span className="role-tag">🧑‍🎓 Student</span>
                        <button onClick={logout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* Stats Bar */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#eef2ff' }}>📋</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.total}</div>
                            <div className="stat-label">Total Applications</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fef9c3' }}>⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.pending}</div>
                            <div className="stat-label">Pending Review</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#f3e8ff' }}>📤</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.forwarded}</div>
                            <div className="stat-label">Forwarded to HOD</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#dcfce7' }}>✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.approved}</div>
                            <div className="stat-label">Approved</div>
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="section-header">
                    <h2 className="section-title">My Leave Applications</h2>
                    {!isApplying && (
                        <button
                            onClick={() => setIsApplying(true)}
                            className="btn btn-primary"
                        >
                            ✏️ Apply for Leave
                        </button>
                    )}
                </div>

                {/* Apply Form */}
                {isApplying && (
                    <div className="form-card">
                        <div className="form-card-title">
                            {editingLeave ? '✏️ Edit Leave Application' : '📝 New Leave Application'}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Type of Leave</label>
                                <select
                                    className="form-control"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="Medical">🏥 Medical</option>
                                    <option value="Important">🔴 Important</option>
                                    <option value="Less Important">🔵 Less Important</option>
                                </select>
                            </div>

                            {/* AI Box */}
                            <div className="ai-box">
                                <div className="ai-box-label">✨ AI Leave Assistant <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#818cf8' }}>(Optional)</span></div>
                                <div className="ai-box-hint">Stuck on what to write? Give us a quick reason and we'll draft a formal letter for you!</div>
                                <div className="ai-input-row">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. I have a fever and need 2 days off"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        disabled={isGenerating}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating}
                                        className="btn btn-primary"
                                        style={{ flexShrink: 0 }}
                                    >
                                        {isGenerating ? '⏳ Generating...' : '✨ Generate'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Leave Letter</label>
                                <textarea
                                    required
                                    className="form-control"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={"Respected Sir/Madam,\nI am writing to request leave for..."}
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsApplying(false);
                                        setEditingLeave(null);
                                        setContent('');
                                        setAiPrompt('');
                                        setType('Medical');
                                    }}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingLeave ? '💾 Update Application' : '🚀 Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Leave List */}
                <div className="leave-list">
                    {leaves.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <p className="empty-state-text">No leave applications yet. Click <strong>"Apply for Leave"</strong> to get started!</p>
                        </div>
                    ) : (
                        leaves.map(leave => (
                            <div key={leave._id} className={getLeaveCardClass(leave.type)}>
                                <div className="leave-card-body">
                                    <div className="leave-card-meta">
                                        <span className={getTypeBadgeClass(leave.type)}>{leave.type}</span>
                                        <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                                        <span className="leave-card-date">🕐 {format(new Date(leave.createdAt), 'PPpp')}</span>
                                    </div>
                                    <div className="leave-card-content">{leave.content}</div>
                                    {leave.comments && (
                                        <div className="leave-card-comment">
                                            <strong>💬 Reviewer Comment:</strong> {leave.comments}
                                        </div>
                                    )}
                                </div>
                                <div className="leave-card-actions">
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(leave)}
                                                className="btn btn-ghost btn-sm btn-full"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleCancel(leave._id)}
                                                className="btn btn-danger btn-sm btn-full"
                                            >
                                                🗑️ Cancel
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => downloadPDF(leave)}
                                        className="btn btn-primary btn-sm btn-full"
                                    >
                                        📄 PDF
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
