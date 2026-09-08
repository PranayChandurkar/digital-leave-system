import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { generateLeavePDF } from '../utils/pdfGenerator';

const StudentHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [studentHistory, setStudentHistory] = useState([]);
    
    // We expect the student object (name, email) to be passed in location.state
    const student = location.state?.student || { _id: id, name: 'Student' };

    useEffect(() => {
        fetchHistory();
    }, [id]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get(`/leaves/student/${id}`);
            setStudentHistory(data);
        } catch (error) {
            console.error('Failed to fetch student history', error);
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

    return (
        <div className="page-bg" style={{ minHeight: '100vh' }}>
            <header className="college-header" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
                <div className="college-header-inner">
                    <div className="college-logo-area">
                        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ color: 'black', marginRight: '15px' }}>← Back</button>
                        <div className="college-logo-text">
                            <span className="app-title">{student.name}'s Leave History</span>
                        </div>
                    </div>
                    <div className="header-user-area">
                        <span className="role-tag">👨‍🏫 {user.role}</span>
                    </div>
                </div>
            </header>

            <main className="main-content" style={{ maxWidth: '1000px', margin: '40px auto' }}>
                <div className="leave-list">
                    {studentHistory.length === 0 ? (
                        <div className="empty-state">No leaves found for this student.</div>
                    ) : (
                        studentHistory.map(leave => (
                            <div key={leave._id} className={getLeaveCardClass(leave.type)}>
                                <div className="leave-card-body">
                                    <div className="leave-card-meta">
                                        <span className={getTypeBadgeClass(leave.type)}>{leave.type}</span>
                                        <span className={getStatusBadgeClass(leave.status)}>{leave.status}</span>
                                        <span className="leave-card-date">🕐 {format(new Date(leave.createdAt), 'PPpp')}</span>
                                    </div>
                                    <div className="leave-card-content">{leave.content}</div>
                                    {leave.comments && (
                                        <div className="leave-card-meta" style={{ marginTop: '10px', color: '#666' }}>
                                            <strong>Remarks:</strong> {leave.comments}
                                        </div>
                                    )}
                                </div>
                                <div className="leave-card-actions">
                                    <button
                                        onClick={() => {
                                            const leaveWithStudent = { ...leave, studentId: student };
                                            generateLeavePDF(leaveWithStudent);
                                        }}
                                        className="btn btn-primary btn-sm btn-full"
                                    >
                                        📄 Download PDF
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

export default StudentHistory;
