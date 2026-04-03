import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';

export const generateLeavePDF = (leave) => {
    try {
        const createDate = leave.createdAt ? new Date(leave.createdAt) : new Date();
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.6; color: #000;">
                <p style="text-align: right;"><strong>Date:</strong> ${format(createDate, 'PP')}</p>
                <p style="text-align: left; margin-bottom: 30px;">
                    <strong>To:</strong><br/>
                    Coordinator / Head of Department<br/>
                </p>
                <div style="margin-bottom: 40px; margin-top: 40px;">
                    <div style="white-space: pre-wrap; margin-top: 15px;">${leave.content}</div>
                    <p style="margin-top: 20px;">Sincerely,</p>
                    <p>${leave.studentId?.name || 'Student'}</p>
                </div>
                <hr style="margin-top: 40px; border-color: #333;"/>
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
