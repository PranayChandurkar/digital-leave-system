import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

export const generateLeavePDF = (leave) => {
    try {
        const createDate = leave.createdAt ? new Date(leave.createdAt) : new Date();
        const element = document.createElement('div');

        let approvalBox = '';
        if (leave.status === 'Approved') {
            const approver = leave.processedBy || 'Not Recorded';
            const processedDate = leave.processedAt ? new Date(leave.processedAt) : new Date(leave.updatedAt || new Date());
            approvalBox = `
                <div style="border: 1px solid black; padding: 10px; width: 250px; font-size: 14px; background-color: white; page-break-inside: avoid;">
                    <p style="margin: 0 0 5px 0;"><strong>Approved By:</strong><br/>${approver}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Remark:</strong> ${leave.comments || 'N/A'}</p>
                    <p style="margin: 0;"><strong>Date & Time:</strong><br/>${format(processedDate, 'PPpp')}</p>
                </div>
            `;
        }

        element.innerHTML = `
            <div style="padding: 3px; font-family: 'Times New Roman', serif; line-height: 1.6; color: #000;">
                <p style="text-align: right;"><strong>Date:</strong> ${format(createDate, 'PP')}</p>
                <p style="text-align: left; margin-bottom: 20px;">
                    <strong>To:</strong><br/>
                    Coordinator / Head of Department<br/>
                </p>
                <div style="position: relative; margin-bottom: 20px;">
                    <div style="white-space: pre-wrap; margin-top: 15px;">${leave.content}</div>
                    
                    <div style="margin-top: 0;">
                        <p style="margin: 15px 0 5px 0;">Sincerely,</p>
                        <p style="margin: 0;">${leave.studentId?.name || 'Student'}</p>
                    </div>
                    ${approvalBox ? `<div style="position: absolute; right: 0; bottom: 0;">${approvalBox}</div>` : ''}
                </div>
                <hr style="margin-top: 30px; border-color: #333;"/>
            </div>
        `;

        const opt = {
            margin: 1,
            filename: `Leave_Application_${leave.studentId?.name || 'Student'}_${format(new Date(), 'yyyyMMdd')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const styles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
                    styles.forEach(s => s.remove());
                }
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.appendChild(element);
        document.body.appendChild(container);

        // Handle possible ESM import object wrapper
        const pdfFunction = typeof html2pdf === 'function' ? html2pdf : (html2pdf.default || html2pdf);

        if (typeof pdfFunction !== 'function') {
            throw new Error("html2pdf library did not load correctly. Contact admin.");
        }

        pdfFunction()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                document.body.removeChild(container);
            })
            .catch((err) => {
                console.error("PDF generation failed:", err);
                alert("PDF generation error: " + (err.message || String(err)));
                if (document.body.contains(container)) document.body.removeChild(container);
            });

    } catch (e) {
        console.error("Error setting up PDF:", e);
        alert("Failed to create PDF. Error: " + e.message);
    }
};
