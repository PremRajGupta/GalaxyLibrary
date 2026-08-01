import { useRef, useState, useEffect } from 'react';
import { Download, Award, Clock, FilePlus } from 'lucide-react';
import { format } from 'date-fns';
import { feeApi, studentApi } from '../../lib/apiService';
import { getStudentDisplayId } from '../../lib/studentId';

interface CertificateTabProps {
  student: any;
  onUpdateStudent?: (updated: any) => void;
}

export default function CertificateTab({ student, onUpdateStudent }: CertificateTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [monthsCompleted, setMonthsCompleted] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [validityLoading, setValidityLoading] = useState(true);

  // Check if certificate was already generated
  const isCertificateGenerated = !!student?.certificateGeneratedDate;
  const generationDate = isCertificateGenerated ? new Date(student.certificateGeneratedDate) : new Date();

  useEffect(() => {
    const checkValidity = async () => {
      if (!student) return;
      try {
        const studentId = getStudentDisplayId(student);
        if (studentId) {
          const validity = await feeApi.getStudentPaymentValidity(studentId);
          if (validity.paymentStatus === 'valid' || validity.paymentStatus === 'expiring-soon') {
            setIsFullyPaid(true);
          } else {
            setIsFullyPaid(false);
          }
        }
      } catch (err) {
        console.error("Failed to check validity", err);
      } finally {
        setValidityLoading(false);
      }
    };
    checkValidity();
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const joinDate = new Date(student.joiningDate || student.admissionDate);
    const currentDate = isCertificateGenerated ? generationDate : new Date();
    
    let months = (currentDate.getFullYear() - joinDate.getFullYear()) * 12;
    months -= joinDate.getMonth();
    months += currentDate.getMonth();

    if (currentDate.getDate() < joinDate.getDate()) {
      months--;
    }

    setMonthsCompleted(Math.max(0, months));
    setIsEligible(months >= 6);
  }, [student, isCertificateGenerated, generationDate]);

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
    const formattedCurrentDate = format(generationDate, 'MMMM d, yyyy');

    const studyText = `He/She studied at Galaxy Library from ${formattedJoinDate} to ${formattedCurrentDate}.`;

    // 1. Draw Student Name
    ctx.font = 'bold 70px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const nameY = canvas.height * 0.53; 
    ctx.fillText(name, canvas.width / 2, nameY);

    // 2. Draw Study Period Text
    ctx.font = '36px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#333333';
    
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
    if (isEligible && isCertificateGenerated) {
      setTimeout(loadAndDrawPreview, 100);
    }
  }, [isEligible, isCertificateGenerated, student]);

  const handleGenerate = async () => {
    if (!isFullyPaid) return;
    setIsGenerating(true);
    try {
      const generatedDate = new Date().toISOString();
      const studentId = student.id || student._id;
      await studentApi.updateStudent(studentId, { certificateGeneratedDate: generatedDate });
      
      // Update local student object to re-render
      student.certificateGeneratedDate = generatedDate;
      if (onUpdateStudent) {
        onUpdateStudent({ ...student, certificateGeneratedDate: generatedDate });
      }
    } catch (err) {
      console.error("Failed to generate certificate record:", err);
      alert("Failed to generate certificate. You might need admin permissions or there is a network error.");
    } finally {
      setIsGenerating(false);
    }
  };

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
          {!validityLoading && !isFullyPaid && !isCertificateGenerated && (
            <p className="text-red-500 text-sm font-semibold mt-2">
              ⚠️ Please clear all pending fee dues to generate the certificate.
            </p>
          )}
        </div>
        
        {!isCertificateGenerated ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!validityLoading && !isFullyPaid)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FilePlus size={18} />
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </button>
        ) : (
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Download size={18} />
            {isGenerating ? 'Downloading...' : 'Download Certificate'}
          </button>
        )}
      </div>

      {isCertificateGenerated ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 p-2 sm:p-4 flex justify-center items-center">
          <canvas 
            ref={canvasRef} 
            className="max-w-full h-auto shadow-md rounded-lg"
            style={{ maxHeight: '70vh' }}
          />
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50">
          <FilePlus size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Certificate Ready</h3>
          <p className="text-center max-w-md">
            You have met the requirements. Click the <strong>Generate Certificate</strong> button above to lock your final dates and view your certificate.
          </p>
        </div>
      )}
    </div>
  );
}
