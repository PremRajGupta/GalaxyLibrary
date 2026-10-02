import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopHeader from '../components/layout/TopHeader';
import { Monitor, Save, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_SITE_CONTENT,
  DEFAULT_FACULTY_PHOTO_URL,
  type SiteContent,
  type ComputerCourse
} from '../data/landingContent';
import {
  loadSiteContent,
  saveSiteContent,
} from '../lib/siteContentService';

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

const cardInputClass =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all';
const cardLabelClass =
  'block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider';

export default function ComputerCenterAdmin() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState<'courses' | 'teachers'>('courses');

  useEffect(() => {
    loadSiteContent()
      .then(({ content }) => setContent(content))
      .finally(() => setLoading(false));
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSiteContent(content);
      const { content: saved } = await loadSiteContent();
      setContent(saved);
      showNotification('Saved! Computer Center settings updated successfully.');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showNotification(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const addCourse = () => {
    setContent(prev => ({
      ...prev,
      computerCourses: [
        ...(prev.computerCourses || []),
        {
          id: `course_${Date.now()}`,
          title: 'New Course',
          fullName: 'NEW COURSE FULL NAME',
          duration: '3 Months',
          fee: '1,000.00',
          color: 'from-slate-900 to-[#0a192f]',
          image: ''
        }
      ]
    }));
  };

  const updateCourse = (index: number, field: keyof ComputerCourse, value: string) => {
    setContent(prev => {
      const updated = [...(prev.computerCourses || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, computerCourses: updated };
    });
  };

  const removeCourse = (index: number) => {
    if (!window.confirm('Delete this course?')) return;
    setContent(prev => {
      const updated = [...(prev.computerCourses || [])];
      updated.splice(index, 1);
      return { ...prev, computerCourses: updated };
    });
  };

  const courses = content.computerCourses || [];

  const nextItemId = (items: { id: number }[]) => {
    return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  };

  const updatePageText = (field: keyof SiteContent['pageText'], value: string) => {
    setContent((prev) => ({
      ...prev,
      pageText: { ...prev.pageText, [field]: value },
    }));
  };

  return (
    <div>
      <TopHeader />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 px-5 py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">
        {/* Header */}
        <div className="page-card mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Monitor size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Computer Center Settings
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage the courses and teachers displayed on the Computer Center page.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl w-max mb-6 border border-slate-200/60">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'courses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Computer Courses
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'teachers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Our Teachers
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'courses' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-card p-6"
              >
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Computer Courses ({courses.length})
                  </h3>
                  <button
                    onClick={addCourse}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold border border-blue-200 transition-colors shadow-sm"
                  >
                    <Plus size={16} /> Add Course
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course, idx) => (
                    <div key={course.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col p-4 shadow-sm">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-slate-200/80">
                        <span className="font-bold text-sm text-blue-600">Course {idx + 1}</span>
                        <button
                          onClick={() => removeCourse(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Image Preview */}
                      <div className="h-36 bg-slate-200 rounded-xl relative group overflow-hidden border border-slate-200 mb-3 flex items-center justify-center">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">No Image</div>
                        )}
                        <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-40 mix-blend-multiply`}></div>
                      </div>

                      {/* Form Fields */}
                      <div className="flex flex-col gap-3 flex-1">
                        <div>
                          <label className={cardLabelClass}>Heading</label>
                          <input
                            type="text"
                            value={course.title}
                            onChange={(e) => updateCourse(idx, 'title', e.target.value)}
                            className={cardInputClass}
                          />
                        </div>
                        
                        <div>
                          <label className={cardLabelClass}>Subtitle / Full Name</label>
                          <textarea
                            value={course.fullName}
                            onChange={(e) => updateCourse(idx, 'fullName', e.target.value)}
                            className={`${cardInputClass} resize-none h-16`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={cardLabelClass}>Duration</label>
                            <input
                              type="text"
                              value={course.duration}
                              onChange={(e) => updateCourse(idx, 'duration', e.target.value)}
                              className={cardInputClass}
                            />
                          </div>
                          <div>
                            <label className={cardLabelClass}>Fee (₹)</label>
                            <input
                              type="text"
                              value={course.fee}
                              onChange={(e) => updateCourse(idx, 'fee', e.target.value)}
                              className={cardInputClass}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={cardLabelClass}>Color Gradient</label>
                          <input
                            type="text"
                            value={course.color}
                            onChange={(e) => updateCourse(idx, 'color', e.target.value)}
                            className={cardInputClass}
                            placeholder="from-... to-..."
                          />
                        </div>

                        <div>
                          <label className={cardLabelClass}>Image URL</label>
                          <input
                            type="text"
                            value={course.image || ''}
                            onChange={(e) => updateCourse(idx, 'image', e.target.value)}
                            className={cardInputClass}
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white border border-slate-200 border-dashed rounded-2xl text-slate-500 text-sm">
                      No courses added yet. Click "Add Course" to create one.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-card p-6"
              >
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl">
                  <p className="text-sm text-amber-900 font-medium">
                    <strong>Storage Saving Tip:</strong> To save server storage space, please use direct image URLs (e.g., from Unsplash, Google Drive, LinkedIn) instead of uploading images directly.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div>
                    <label className={labelClass}>Section Title</label>
                    <input
                      className={inputClass}
                      value={content.pageText.teacherTitle || ''}
                      onChange={(e) => updatePageText('teacherTitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Section Subtitle</label>
                    <input
                      className={inputClass}
                      value={content.pageText.teacherSubtitle || ''}
                      onChange={(e) => updatePageText('teacherSubtitle', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Teacher Profiles</h3>
                  {(content.computerCenterTeachers?.length || 0) < 6 && (
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) => ({
                          ...prev,
                          computerCenterTeachers: [
                            ...(prev.computerCenterTeachers || []),
                            {
                              id: nextItemId(prev.computerCenterTeachers || []),
                              photo: DEFAULT_FACULTY_PHOTO_URL,
                              name: 'New Teacher',
                              role: 'Role / Designation',
                              detail: 'Short detail about this teacher.',
                            },
                          ],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold border border-blue-200 transition-colors shadow-sm"
                    >
                      <Plus size={16} /> Add Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(content.computerCenterTeachers || []).map((member, index) => (
                    <div key={member.id} className="bg-slate-50/80 border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200/80">
                        <span className="font-bold text-sm text-blue-600">Profile {index + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent((prev) => ({
                              ...prev,
                              computerCenterTeachers: (prev.computerCenterTeachers || []).filter((item) => item.id !== member.id),
                            }))
                          }
                          disabled={(content.computerCenterTeachers || []).length <= 1}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete profile"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="h-32 bg-slate-200 rounded-xl relative group overflow-hidden border border-slate-200 mb-3 flex items-center justify-center">
                        {member.photo?.trim() ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">No photo preview</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 flex-1">
                        <div>
                          <label className={cardLabelClass}>Photo URL</label>
                          <input
                            className={cardInputClass}
                            value={member.photo}
                            onChange={(e) => {
                              const photo = e.target.value;
                              setContent((prev) => {
                                const computerCenterTeachers = [...(prev.computerCenterTeachers || [])];
                                computerCenterTeachers[index] = { ...member, photo };
                                return { ...prev, computerCenterTeachers };
                              });
                            }}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Name</label>
                          <input
                            className={cardInputClass}
                            value={member.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setContent((prev) => {
                                const computerCenterTeachers = [...(prev.computerCenterTeachers || [])];
                                computerCenterTeachers[index] = { ...member, name };
                                return { ...prev, computerCenterTeachers };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Role / Designation</label>
                          <input
                            className={cardInputClass}
                            value={member.role}
                            onChange={(e) => {
                              const role = e.target.value;
                              setContent((prev) => {
                                const computerCenterTeachers = [...(prev.computerCenterTeachers || [])];
                                computerCenterTeachers[index] = { ...member, role };
                                return { ...prev, computerCenterTeachers };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className={cardLabelClass}>Detail</label>
                          <textarea
                            className={`${cardInputClass} resize-none`}
                            rows={2}
                            value={member.detail}
                            onChange={(e) => {
                              const detail = e.target.value;
                              setContent((prev) => {
                                const computerCenterTeachers = [...(prev.computerCenterTeachers || [])];
                                computerCenterTeachers[index] = { ...member, detail };
                                return { ...prev, computerCenterTeachers };
                              });
                            }}
                            placeholder="Short detail..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex justify-end pt-4 pb-10">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
