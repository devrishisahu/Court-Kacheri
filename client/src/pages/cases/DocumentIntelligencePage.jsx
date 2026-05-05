import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments } from '../../store/slices/documentSlice';
import DocumentAnalysisPanel from '../../components/ai/DocumentAnalysisPanel';
import AnalysisTriggerButton from '../../components/ai/AnalysisTriggerButton';
import Card from '../../components/ui/Card';

export default function DocumentIntelligencePage() {
  const { id: caseId, docId } = useParams();
  const dispatch = useDispatch();
  
  const { items: documents, loading } = useSelector((state) => state.documents);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    if (!documents || documents.length === 0) {
      dispatch(fetchDocuments(caseId));
    }
  }, [dispatch, caseId, documents]);

  useEffect(() => {
    if (documents.length > 0) {
      const doc = documents.find(d => d._id === docId);
      if (doc) setDocument(doc);
    }
  }, [documents, docId]);

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const fileUrl = `${apiBaseURL}/documents/file/${document.fileUrl?.split('/').pop()}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header Back Link */}
      <Link to={`/cases/${caseId}`} className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm font-['Inter'] mb-2">
        <ArrowLeft size={16} /> Back to Case Details
      </Link>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column: Document Viewer & Basic Info */}
        <div className="xl:w-1/3 flex flex-col gap-6">
          <Card className="flex flex-col h-full border-[#2a2a2a] bg-gradient-to-b from-[#1a1a1a] to-[#111111]">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
                {document.mimeType === 'application/pdf' ? 'PDF Document' : 'Document File'}
              </span>
              <h1 className="text-2xl font-bold text-white font-['Playfair_Display'] leading-tight break-words">
                {document.fileName}
              </h1>
              <p className="text-[#a0a0a0] text-sm mt-3 font-['Inter']">
                Uploaded by {document.uploadedBy?.name || 'Firm Member'} on {new Date(document.createdAt).toLocaleDateString()}
              </p>
              <p className="text-[#555555] text-xs mt-1 font-['Inter'] font-mono">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                <ExternalLink size={16} /> View Original
              </a>
              <a 
                href={fileUrl} 
                download
                className="p-2.5 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333333] transition-colors"
                title="Download"
              >
                <Download size={16} />
              </a>
            </div>

            {document.mimeType === 'application/pdf' && (
              <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
                <h3 className="text-white text-sm font-medium mb-3 uppercase tracking-wider">AI Operations</h3>
                <div className="bg-[#111111] p-4 rounded-xl border border-[#222222]">
                   <AnalysisTriggerButton documentId={document._id} mimeType={document.mimeType} />
                   <p className="text-[#555555] text-xs mt-3 leading-relaxed">
                     Trigger an artificial intelligence scan over the contents of this document. It will extract actionable insight and flag risks instantly.
                   </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Analysis Display */}
        <div className="xl:w-2/3 flex flex-col gap-6">
           {document.mimeType === 'application/pdf' ? (
             <div className="flex-1">
               <h2 className="text-xl font-bold text-white font-['Playfair_Display'] mb-4 flex items-center gap-2">
                  <span className="w-8 h-px bg-indigo-500 rounded-full" />
                  Gemini AI Summary & Findings
               </h2>
               <div className="bg-[#111111] border border-indigo-500/20 rounded-2xl overflow-hidden min-h-[500px]">
                 <DocumentAnalysisPanel documentId={document._id} fileName={document.fileName} />
               </div>
             </div>
           ) : (
             <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed border-[#2a2a2a]">
               <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                 <span className="text-[#555555] text-2xl font-['Playfair_Display']">!</span>
               </div>
               <h3 className="text-white font-semibold font-['Inter']">AI Not Available</h3>
               <p className="text-[#a0a0a0] text-sm text-center max-w-sm mt-2">
                 The Gemini AI visual analyzer requires a PDF document. Ensure your uploads are properly formatted PDF text.
               </p>
             </Card>
           )}
        </div>
      </div>
    </motion.div>
  );
}
