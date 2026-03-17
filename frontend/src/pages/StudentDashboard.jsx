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
            setType('Medical');
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving leave');
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
        // Hydrate leave with student info as studentId might not be populated in my-leaves route
        const leaveWithStudent = { ...leave, studentId: { name: user.name, email: user.email } };
        generateLeavePDF(leaveWithStudent);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Student Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{user.name}</span>
                        <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold border-b pb-2">My Leave Applications</h2>
                    <button 
                        onClick={() => setIsApplying(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Apply Leave
                    </button>
                </div>

                {isApplying && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md border">
                        <h3 className="text-lg font-medium mb-4">{editingLeave ? 'Edit Leave' : 'New Leave Application'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type of Leave</label>
                                <select 
                                    className="mt-1 block w-full p-2 border rounded-md"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="Medical">Medical</option>
                                    <option value="Important">Important</option>
                                    <option value="Less Important">Less Important</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Leave Letter (Write formally)</label>
                                <textarea
                                    required
                                    className="mt-1 block w-full p-2 border rounded-md h-40 font-serif"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Respected Sir/Madam,&#10;I am writing to request leave..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsApplying(false); setEditingLeave(null); setContent(''); setType('Medical'); }}
                                    className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {editingLeave ? 'Update Application' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {leaves.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No leave applications found.</p>
                    ) : (
                        leaves.map(leave => (
                            <div key={leave._id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row gap-6 justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            leave.type === 'Important' ? 'bg-red-100 text-red-700' :
                                            leave.type === 'Medical' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>{leave.type}</span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                            leave.status === 'Forwarded' ? 'bg-purple-100 text-purple-700' :
                                            leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>{leave.status}</span>
                                        <span className="text-sm text-gray-500">{format(new Date(leave.createdAt), 'PPpp')}</span>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded text-sm text-gray-800 whitespace-pre-wrap font-serif border border-gray-100">
                                        {leave.content}
                                    </div>
                                    {leave.comments && (
                                        <div className="mt-3 text-sm text-gray-600 bg-yellow-50 p-2 border-l-4 border-yellow-400">
                                            <strong>Reviewer Comment:</strong> {leave.comments}
                                        </div>
                                    )}
                                </div>
                                <div className="flex md:flex-col gap-2 justify-start items-end md:w-32">
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleEdit(leave)} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 w-full text-center">Edit</button>
                                            <button onClick={() => handleCancel(leave._id)} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 w-full text-center">Cancel</button>
                                        </>
                                    )}
                                    <button onClick={() => downloadPDF(leave)} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200 w-full text-center">Download PDF</button>
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
