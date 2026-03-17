import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';

import { generateLeavePDF } from '../utils/pdfGenerator';

const CoordinatorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [actionModal, setActionModal] = useState(null); // { leaveId, action }
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
            // Highlight important by sorting them to the top
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

    const downloadPDF = (leave) => {
        generateLeavePDF(leave);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="bg-white shadow border-b-4 border-blue-500">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold">Coordinator Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{user.name}</span>
                        <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold border-b pb-2">Student Leave Queue</h2>
                    <button 
                        onClick={() => setIsCreatingUser(!isCreatingUser)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                    >
                        {isCreatingUser ? 'Cancel' : 'Add New Student'}
                    </button>
                </div>

                {isCreatingUser && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-green-200">
                        <h3 className="text-lg font-medium mb-4">Create Student Account</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <input type="text" required className="w-full mt-1 p-2 border rounded" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Email</label>
                                    <input type="email" required className="w-full mt-1 p-2 border rounded" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Password</label>
                                    <input type="password" required className="w-full mt-1 p-2 border rounded" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Student</button>
                        </form>
                    </div>
                )}

                {actionModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h3 className="text-lg font-bold mb-4">
                                Confirm {actionModal.action}
                            </h3>
                            <form onSubmit={handleProcess}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Comments (Optional)</label>
                                    <textarea
                                        className="w-full mt-1 p-2 border rounded h-24"
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add any reasoning or remarks..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setActionModal(null)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100">Cancel</button>
                                    <button type="submit" className={`px-4 py-2 text-white rounded ${
                                        actionModal.action === 'Approve' ? 'bg-green-600 hover:bg-green-700' :
                                        actionModal.action === 'Reject' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-purple-600 hover:bg-purple-700'
                                    }`}>
                                        {actionModal.action} Leave
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {leaves.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Queue is empty.</p>
                    ) : (
                        leaves.map(leave => (
                            <div key={leave._id} className={`bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row gap-6 justify-between ${leave.type === 'Important' ? 'border-l-4 border-l-red-500' : ''}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-gray-900">{leave.studentId.name}</span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            leave.type === 'Important' ? 'bg-red-100 text-red-700 font-bold animate-pulse' :
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
                                </div>
                                <div className="flex md:flex-col gap-2 justify-start items-end md:w-32">
                                    {leave.status === 'Pending' && (
                                        <>
                                            <button onClick={() => setActionModal({ leaveId: leave._id, action: 'Approve' })} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 w-full text-center font-medium">Approve</button>
                                            <button onClick={() => setActionModal({ leaveId: leave._id, action: 'Forward' })} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 w-full text-center font-medium">Forward to HOD</button>
                                            <button onClick={() => setActionModal({ leaveId: leave._id, action: 'Reject' })} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 w-full text-center font-medium">Reject</button>
                                        </>
                                    )}
                                    <button onClick={() => downloadPDF(leave)} className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200 w-full text-center mt-2">Download PDF</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default CoordinatorDashboard;
