import React, { useRef, useState, useEffect } from 'react';
import { Download, Award, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface CertificateTabProps {
  student: any;
}

export default function CertificateTab({ student }: CertificateTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [monthsCompleted, setMonthsCompleted] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!student) return;
    const joinDate = new Date(student.joiningDate || student.admissionDate);
    const currentDate = new Date();
    
    let months = (currentDate.getFullYear() - joinDate.getFullYear()) * 12;
    months -= joinDate.getMonth();
    months += currentDate.getMonth();

    if (currentDate.getDate() < joinDate.getDate()) {
      months--;
    }

    setMonthsCompleted(Math.max(0, months));
    setIsEligible(months >= 6);
  }, [student]);

  const drawCertificate = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const rawName = student?.name || 'Student Name';
    const name = rawName.split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const joinDate = new Date(student.joiningDate || student.admissionDate);
    const formattedJoinDate = format(joinDate, 'MMMM d, yyyy');
    const formattedCurrentDate = format(new Date(), 'MMMM d, yyyy');

    const studyText = `He/She studied at Galaxy Library from ${formattedJoinDate} to ${formattedCurrentDate}.`;

    // 1. Draw Student Name
    ctx.font = 'bold 70px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Move name closer to the horizontal line
    const nameY = canvas.height * 0.53; 
    ctx.fillText(name, canvas.width / 2, nameY);

    // 2. Draw Study Period Text
    // Smaller font size for study period so it fits better
    ctx.font = '36px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#333333';
    
    // Move text closer to the horizontal line (just below it)
    const textY = canvas.height * 0.60;
    ctx.fillText(studyText, canvas.width / 2, textY);
  };

  const loadAndDrawPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/certificate-template.png';
    img.onload = () => {
      drawCertificate(canvas, ctx, img);
    };
    img.onerror = () => {
      canvas.width = 1000;
      canvas.height = 700;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '30px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('Template image (certificate-template.png) not found in public folder.', canvas.width/2, canvas.height/2);
    };
  };

  useEffect(() => {
    if (isEligible) {
      // Need a small timeout to ensure canvas is rendered before trying to get context
      setTimeout(loadAndDrawPreview, 100);
    }
  }, [isEligible, student]);

  const handleDownload = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${student?.name?.replace(/\s+/g, '_') || 'Student'}_Certificate.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to generate certificate", err);
      }
    }
    setIsGenerating(false);
  };

  if (!isEligible) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto mt-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Certificate Not Available Yet</h2>
        <p className="text-slate-600 text-lg mb-6 leading-relaxed">
          Certificates are awarded to students who have completed at least <strong>6 months</strong> at Galaxy Library.
        </p>
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 inline-block w-full max-w-md">
          <div className="grid grid-cols-2 gap-8 text-left">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Time Completed</p>
              <p className="text-2xl font-bold text-slate-800">{monthsCompleted} <span className="text-lg font-medium text-slate-500">months</span></p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Required</p>
              <p className="text-2xl font-bold text-slate-800">6 <span className="text-lg font-medium text-slate-500">months</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mt-5 overflow-hidden">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min((monthsCompleted / 6) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-8 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-amber-500" />
            Certificate of Participation
          </h2>
          <p className="text-slate-500 mt-1">Congratulations! You have successfully completed {monthsCompleted} months at Galaxy Library.</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <Download size={18} />
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </button>
      </div>

      <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 p-2 sm:p-4 flex justify-center items-center">
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto shadow-md rounded-lg"
          style={{ maxHeight: '70vh' }}
        />
      </div>
    </div>
  );
}
