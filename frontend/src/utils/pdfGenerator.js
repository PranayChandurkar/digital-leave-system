import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

export const generateLeavePDF = (leave) => {
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="padding: 40px; font-family: 'Times New Roman', serif; line-height: 1.6; color: #000;">
            <p style="text-align: right;"><strong>Date:</strong> ${format(new Date(leave.createdAt), 'PP')}</p>
            <p style="text-align: left; margin-bottom: 20px;">
                <strong>From:</strong><br/>
                ${leave.studentId?.name || 'Student'}<br/>
                ${leave.studentId?.email || ''}
            </p>
            <p style="text-align: left; margin-bottom: 30px;">
                <strong>To:</strong><br/>
                Coordinator / Head of Department<br/>
            </p>
            <div style="margin-bottom: 40px; margin-top: 40px;">
                <p>Respected Sir/Madam,</p>
                <div style="white-space: pre-wrap; margin-top: 15px;">${leave.content}</div>
                <p style="margin-top: 20px;">Sincerely,</p>
                <p>${leave.studentId?.name || 'Student'}</p>
            </div>
            <hr style="margin-top: 40px; border-color: #333;"/>
            <div style="margin-top: 20px;">
                <h3>Application Details</h3>
                <p><strong>Type:</strong> ${leave.type}</p>
                <p><strong>Status:</strong> ${leave.status}</p>
                <p><strong>Comments:</strong> ${leave.comments || 'None'}</p>
            </div>
        </div>
    `;

    const opt = {
        margin: 1,
        filename: `Leave_Application_${leave.studentId?.name || 'Student'}_${format(new Date(), 'yyyyMMdd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
};
