import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { generateLeavePDF } from '../utils/pdfGenerator';

const CoordinatorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [actionModal, setActionModal] = useState(null);
    const [comments, setComments] = useState('');

    // User Creation
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leaves/queue');
            const sorted = data.sort((a, b) => {
                if (a.type === 'Important' && b.type !== 'Important') return -1;
                if (a.type !== 'Important' && b.type === 'Important') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setLeaves(sorted);
        } catch (error) {
            console.error('Failed to fetch queue', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/create-user', {
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: 'Student'
            });
            alert('Student created successfully');
            setIsCreatingUser(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating user');
        }
    };

    const handleProcess = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/leaves/${actionModal.leaveId}/process`, {
                action: actionModal.action,
                comments
            });
            setActionModal(null);
            setComments('');
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing leave');
        }
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

    const counts = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        important: leaves.filter(l => l.type === 'Important').length,
    };

    return (
        <div className="page-bg">
            {/* Header */}
            <header className="college-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)' }}>
                <div className="college-header-inner">
                    <div className="college-logo-area">
                        <div className="college-logo-icon">📋</div>
                        <div className="college-logo-text">
                            <span className="app-title">LeaveSync</span>
                            <span className="app-subtitle">Coordinator Portal</span>
                        </div>
                    </div>
                    <div className="header-user-area">
                        <div className="user-chip">
                            <div className="user-avatar" style={{ background: '#f59e0b' }}>{user.name?.[0]}</div>
                            <span className="user-name">{user.name}</span>
                        </div>
                        <span className="role-tag">👨‍🏫 Coordinator</span>
                        <button onClick={logout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* Stats */}
                <div className="stats-bar">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#ecfdf5' }}>📥</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.total}</div>
                            <div className="stat-label">In Queue</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fef9c3' }}>⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.pending}</div>
                            <div className="stat-label">Awaiting Action</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#fee2e2' }}>🚨</div>
                        <div className="stat-info">
                            <div className="stat-value">{counts.important}</div>
                            <div className="stat-label">Important / Urgent</div>
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="section-header">
                    <h2 className="section-title">Student Leave Queue</h2>
                    <button
                        onClick={() => setIsCreatingUser(!isCreatingUser)}
                        className={`btn ${isCreatingUser ? 'btn-ghost' : 'btn-success'}`}
                    >
                        {isCreatingUser ? '✕ Cancel' : '➕ Add New Student'}
                    </button>
                </div>

                {/* Create Student Form */}
                {isCreatingUser && (
                    <div className="form-card">
                        <div className="form-card-title">🧑‍🎓 Create Student Account</div>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-control"
                                        placeholder="Student Name"
                                        value={newUserName}
                                        onChange={e => setNewUserName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        placeholder="student@college.edu"
                                        value={newUserEmail}
                                        onChange={e => setNewUserEmail(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="form-control"
                                        placeholder="••••••••"
                                        value={newUserPassword}
                                        onChange={e => setNewUserPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-success">🎉 Create Student</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Leave List */}
                <div className="leave-list">
                    {leaves.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">✅</div>
                            <p className="empty-state-text">All clear! No pending applications in the queue.</p>
                        </div>
                    ) : (
                        leaves.map(leave => (
                            <div key={leave._id} className={getLeaveCardClass(leave.type)}>
                                <div className="leave-card-body">
                                    <div className="leave-card-student">{leave.studentId?.name || 'Unknown Student'}</div>
                                    <div className="leave-card-meta">
                                        <span className={getTypeBadgeClass(leave.type)}>{leave.type}</span>
                                        <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                                        <span className="leave-card-date">🕐 {format(new Date(leave.createdAt), 'PPpp')}</span>
                                    </div>
                                    <div className="leave-card-content">{leave.content}</div>
                                </div>
                                <div className="leave-card-actions">
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button
                                                onClick={() => setActionModal({ leaveId: leave._id, action: 'Approve' })}
                                                className="btn btn-success btn-sm btn-full"
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ leaveId: leave._id, action: 'Forward' })}
                                                className="btn btn-purple btn-sm btn-full"
                                            >
                                                📤 HOD
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ leaveId: leave._id, action: 'Reject' })}
                                                className="btn btn-danger btn-sm btn-full"
                                            >
                                                ❌ Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => generateLeavePDF(leave)}
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

            {/* Action Modal */}
            {actionModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-title">
                            {actionModal.action === 'Approve' ? '✅' : actionModal.action === 'Reject' ? '❌' : '📤'}
                            &nbsp;Confirm {actionModal.action}
                        </div>
                        <form onSubmit={handleProcess}>
                            <div className="form-group">
                                <label className="form-label">Comments (Optional)</label>
                                <textarea
                                    className="form-control"
                                    style={{ height: '100px' }}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Add reasoning or remarks..."
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setActionModal(null)}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn ${actionModal.action === 'Approve' ? 'btn-success' : actionModal.action === 'Reject' ? 'btn-danger' : 'btn-purple'}`}
                                >
                                    {actionModal.action} Leave
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorDashboard;
