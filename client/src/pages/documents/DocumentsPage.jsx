import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments, uploadDocument, deleteDocument, clearDocuments } from '../../store/slices/documentSlice';
import { fetchCases } from '../../store/slices/caseSlice';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const dispatch = useDispatch();
  const { items: cases } = useSelector((state) => state.cases);
  const { items: documents, loading, uploading } = useSelector((state) => state.documents);
  const [selectedCase, setSelectedCase] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    dispatch(fetchCases({ limit: 100 }));
    return () => { dispatch(clearDocuments()); };
  }, [dispatch]);

  useEffect(() => {
    if (selectedCase) dispatch(fetchDocuments(selectedCase));
  }, [selectedCase, dispatch]);

  const uploadFile = async (file) => {
    if (!selectedCase) return toast.error('Select a case first');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return toast.error('Only PDF & DOCX allowed');
    if (file.size > 10 * 1024 * 1024) return toast.error('File exceeds 10MB');

    try {
      await dispatch(uploadDocument({ file, caseId: selectedCase })).unwrap();
      toast.success('Uploaded!');
      dispatch(fetchDocuments(selectedCase));
    } catch (err) {
      toast.error(err || 'Upload failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  const handleDelete = async (docId) => {
    try {
      await dispatch(deleteDocument(docId)).unwrap();
      toast.success('Deleted');
    } catch (err) {
      toast.error(err || 'Delete failed');
    }
  };

  const isPDF = (mime) => mime?.includes('pdf');
  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-8">Documents</h1>

      {/* Case Selector */}
      <div className="mb-6">
        <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter'] block mb-2">Select Case</label>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-['Inter'] focus:outline-none focus:border-white/30 w-full max-w-md"
        >
          <option value="">Choose a case...</option>
          {cases.map(c => <option key={c._id} value={c._id}>{c.caseNumber} — {c.title}</option>)}
        </select>
      </div>

      {/* Upload Zone */}
      {selectedCase && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center bg-[#111111] border-2 border-dashed rounded-2xl p-12 mb-8 cursor-pointer transition-colors ${
            dragActive ? 'border-white/40 bg-white/[0.02]' : 'border-[#2a2a2a] hover:border-white/20'
          }`}
        >
          <Upload size={32} className="text-[#555555] mb-3" />
          <p className="text-[#a0a0a0] text-sm font-['Inter']">{uploading ? 'Uploading...' : 'Drop PDF or DOCX files here'}</p>
          <p className="text-[#555555] text-xs font-['Inter'] mt-1">or click to browse • Max 10MB</p>
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} disabled={uploading} />
        </label>
      )}

      {/* Document List */}
      {selectedCase && (
        <div className="space-y-2">
          {loading
            ? [1, 2, 3].map(i => <div key={i} className="h-16 bg-[#111111] rounded-lg animate-pulse border border-[#2a2a2a]" />)
            : documents.length === 0
            ? <p className="text-[#555555] text-sm font-['Inter'] text-center py-12">No documents uploaded for this case</p>
            : documents.map(doc => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between bg-[#111111] border border-[#2a2a2a] rounded-lg px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPDF(doc.mimeType) ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <a
                        href={`${apiBaseURL}/documents/file/${doc.fileUrl?.split('/').pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white text-sm font-['Inter'] hover:underline"
                      >
                        {doc.fileName}
                      </a>
                      <p className="text-[#555555] text-xs font-['Inter']">
                        {formatSize(doc.fileSize)} • {doc.uploadedBy?.name || 'Unknown'} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(doc._id)} className="text-[#555555] hover:text-[#f87171] transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
          }
        </div>
      )}

      {!selectedCase && (
        <div className="flex flex-col items-center justify-center py-20">
          <FileText size={40} className="text-[#555555] mb-4" />
          <p className="text-[#555555] text-sm font-['Inter']">Select a case to view and upload documents</p>
        </div>
      )}
    </motion.div>
  );
}
