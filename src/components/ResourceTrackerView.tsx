import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpenCheck, 
  BookOpen,
  Plus, 
  Trash2, 
  Check, 
  Award, 
  FileText, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Search,
  CheckSquare,
  Square,
  Layers,
  BarChart2,
  Pencil,
  Smartphone,
  LayoutGrid,
  Table
} from 'lucide-react';
import { ResourceItem, PastExamItem } from '../types';
import { YKS_SUBJECTS, YKS_CURRICULUM_TOPICS } from '../data/initialData';
import { RECOMMENDED_BOOKS, RecommendedBook } from '../data/books';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ResourceTrackerViewProps {
  resources: ResourceItem[];
  pastExams: PastExamItem[];
  onAddResource: (res: Omit<ResourceItem, 'id'>) => void;
  onUpdateResource: (res: ResourceItem) => void;
  onDeleteResource: (id: string) => void;
  onUpdatePastExam: (pe: PastExamItem) => void;
  topicStatuses: Record<string, 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım'>;
  onUpdateTopicStatus: (topicName: string, status: 'Çalışmadım' | 'Erteledim' | 'Zor Geldi' | 'Çalıştım' | 'Uzmanlaştım', isManual?: boolean) => void;
  manuallyChangedTopicStatuses?: string[];
  initialTrackerTab?: 'resources' | 'topics';
  initialDersFilter?: string;
}


const RECOMMENDED_RESOURCES = [
  { subject: 'Matematik (TYT-AYT)', books: ['345 Yayınları', 'Bilgi Sarmal', '3D Yayınları', 'Orijinal Matematik', 'Acil Matematik', 'Apotemi Fasikülleri'] },
  { subject: 'Fizik (TYT-AYT)', books: ['345 Yayınları', 'Bilgi Sarmal', 'Nihat Bilgin Yayıncılık', '3D Yayınları', 'Ertan Sinan Şahin', 'Karaağaç'] },
  { subject: 'Kimya (TYT-AYT)', books: ['Aydın Yayınları', 'Orbital Yayınları', 'Miray Yayınları', '345 Yayınları', 'Bilgi Sarmal'] },
  { subject: 'Biyoloji (TYT-AYT)', books: ['Palme Yayınları', 'Biyotik Yayınları', 'Bilgi Sarmal', '3D Yayınları', 'Apotemi (Sistemler)'] },
  { subject: 'Türkçe', books: ['Limit Kronometre (Paragraf)', 'Bilgi Sarmal', '345 Yayınları', 'Hız ve Renk (Paragraf)', 'Karekök'] },
  { subject: 'Tarih / Coğrafya', books: ['Benim Hocam', 'Bilgi Sarmal', 'Limit El Kitapları', 'Yavuz Tuna Haritalarla Coğrafya'] }
];

const getTopicsForResource = (subject: string, examType: 'TYT' | 'AYT'): string[] => {
  if (!subject) return [];
  if (YKS_CURRICULUM_TOPICS[subject]) {
    return YKS_CURRICULUM_TOPICS[subject];
  }

  const subLower = subject.toLowerCase();
  
  if (subLower.includes('paragraf')) {
    return YKS_CURRICULUM_TOPICS['Paragraf'] || [];
  }
  if (subLower.includes('problem')) {
    return YKS_CURRICULUM_TOPICS['Problemler'] || [];
  }

  let mappedKey = '';
  
  if (subLower.includes('türkçe') || subLower.includes('edebiyat') || subLower.includes('türk dili')) {
    mappedKey = examType === 'TYT' ? 'TYT Türkçe' : 'AYT Edebiyat';
  } else if (subLower.includes('matematik')) {
    mappedKey = examType === 'TYT' ? 'TYT Matematik' : 'AYT Matematik';
  } else if (subLower.includes('geometri')) {
    mappedKey = examType === 'TYT' ? 'TYT Geometri' : 'AYT Geometri';
  } else if (subLower.includes('fizik')) {
    mappedKey = examType === 'TYT' ? 'TYT Fizik' : 'AYT Fizik';
  } else if (subLower.includes('kimya')) {
    mappedKey = examType === 'TYT' ? 'TYT Kimya' : 'AYT Kimya';
  } else if (subLower.includes('biyoloji')) {
    mappedKey = examType === 'TYT' ? 'TYT Biyoloji' : 'AYT Biyoloji';
  } else if (subLower.includes('tarih')) {
    mappedKey = examType === 'TYT' ? 'TYT Tarih' : 'AYT Tarih';
  } else if (subLower.includes('coğrafya')) {
    mappedKey = examType === 'TYT' ? 'TYT Coğrafya' : 'AYT Coğrafya';
  } else if (subLower.includes('felsefe')) {
    mappedKey = examType === 'TYT' ? 'TYT Felsefe' : 'AYT Felsefe Grubu';
  }

  if (mappedKey && YKS_CURRICULUM_TOPICS[mappedKey]) {
    return YKS_CURRICULUM_TOPICS[mappedKey];
  }

  const resolvedKey = Object.keys(YKS_CURRICULUM_TOPICS).find(key => {
    const kLower = key.toLowerCase();
    return kLower.includes(examType.toLowerCase()) && (kLower.includes(subLower) || subLower.includes(kLower.replace('tyt ', '').replace('ayt ', '')));
  });

  if (resolvedKey) {
    return YKS_CURRICULUM_TOPICS[resolvedKey];
  }

  return [];
};

const COURSE_TOPICS_MAPPING: Record<string, string[]> = {
  'Matematik': ['TYT Matematik', 'AYT Matematik'],
  'Geometri': ['TYT Geometri', 'AYT Geometri'],
  'Türkçe': ['TYT Türkçe', 'AYT Edebiyat', 'Paragraf'],
  'Fizik': ['TYT Fizik', 'AYT Fizik'],
  'Kimya': ['TYT Kimya', 'AYT Kimya'],
  'Biyoloji': ['TYT Biyoloji', 'AYT Biyoloji'],
  'Tarih': ['TYT Tarih', 'AYT Tarih-1', 'AYT Tarih-2'],
  'Coğrafya': ['TYT Coğrafya', 'AYT Coğrafya-1', 'AYT Coğrafya-2'],
  'Felsefe': ['TYT Felsefe', 'AYT Felsefe Grubu'],
  'Din Kültürü': ['TYT Din Kültürü']
};

const getTopicsForSelectedDers = (dersFilter: string, examTypeFilter: string): { key: string; topics: string[] }[] => {
  const mapping = COURSE_TOPICS_MAPPING[dersFilter];
  let keysToUse = mapping || [];
  if (mapping) {
    if (examTypeFilter === 'TYT') {
      keysToUse = mapping.filter(k => k.toLowerCase().includes('tyt') || k.toLowerCase().includes('paragraf') || (!k.toLowerCase().includes('ayt') && !k.toLowerCase().includes('edebiyat')));
    } else if (examTypeFilter === 'AYT') {
      keysToUse = mapping.filter(k => k.toLowerCase().includes('ayt') || k.toLowerCase().includes('edebiyat') || k.toLowerCase().includes('tarih') || k.toLowerCase().includes('coğrafya') || k.toLowerCase().includes('felsefe'));
    }
    return keysToUse.map(key => ({
      key,
      topics: YKS_CURRICULUM_TOPICS[key] || []
    })).filter(item => item.topics.length > 0);
  }

  const matchedKeys = Object.keys(YKS_CURRICULUM_TOPICS).filter(k => {
    const kLower = k.toLowerCase();
    const matchesD = kLower.includes(dersFilter.toLowerCase());
    const matchesExam = examTypeFilter === 'all' ? true : kLower.includes(examTypeFilter.toLowerCase());
    return matchesD && matchesExam;
  });

  if (matchedKeys.length > 0) {
    return matchedKeys.map(key => ({
      key,
      topics: YKS_CURRICULUM_TOPICS[key] || []
    }));
  }

  return [];
};

const QUICK_COURSES = [
  { value: 'Matematik', label: 'Matematik', color: 'from-blue-600 to-indigo-600' },
  { value: 'Geometri', label: 'Geometri', color: 'from-cyan-600 to-blue-600' },
  { value: 'Türkçe', label: 'Türkçe / Edebiyat', color: 'from-amber-600 to-orange-600' },
  { value: 'Fizik', label: 'Fizik', color: 'from-purple-600 to-indigo-600' },
  { value: 'Kimya', label: 'Kimya', color: 'from-emerald-600 to-teal-600' },
  { value: 'Biyoloji', label: 'Biyoloji', color: 'from-rose-600 to-pink-600' },
  { value: 'Tarih', label: 'Tarih', color: 'from-amber-700 to-yellow-600' },
  { value: 'Coğrafya', label: 'Coğrafya', color: 'from-green-600 to-emerald-600' },
  { value: 'Felsefe', label: 'Felsefe', color: 'from-violet-600 to-purple-600' },
  { value: 'Din Kültürü', label: 'Din Kültürü', color: 'from-sky-600 to-indigo-600' },
];

export const ResourceTrackerView: React.FC<ResourceTrackerViewProps> = ({
  resources,
  pastExams,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onUpdatePastExam,
  topicStatuses,
  onUpdateTopicStatus,
  manuallyChangedTopicStatuses = [],
  initialTrackerTab,
  initialDersFilter
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingResource, setDeletingResource] = useState<{ id: string; title: string } | null>(null);
  
  // Expanded book topic checklists map: bookId -> boolean
  const [expandedBookIds, setExpandedBookIds] = useState<Record<string, boolean>>({});
  
  // Topic search term per book
  const [topicSearchQuery, setTopicSearchQuery] = useState<Record<string, string>>({});

  // Filter States
  const [selectedDersFilter, setSelectedDersFilter] = useState<string>(initialDersFilter || 'all');
  const [selectedExamTypeFilter, setSelectedExamTypeFilter] = useState<string>('all');
  const [trackerTab, setTrackerTab] = useState<'resources' | 'topics'>(initialTrackerTab || 'resources');

  React.useEffect(() => {
    if (initialTrackerTab) {
      setTrackerTab(initialTrackerTab);
    }
    if (initialDersFilter) {
      setSelectedDersFilter(initialDersFilter);
    }
  }, [initialTrackerTab, initialDersFilter]);

  // Auto-scan and update any topic that has solved tests in any resource but is marked "Çalışmadım"
  React.useEffect(() => {
    if (!resources || resources.length === 0) return;

    const solvedTopicsSet = new Set<string>();
    resources.forEach(book => {
      if (book.completedTopics && Array.isArray(book.completedTopics)) {
        book.completedTopics.forEach(t => solvedTopicsSet.add(t));
      }
    });

    solvedTopicsSet.forEach(topicName => {
      const currentStatus = topicStatuses[topicName] || 'Çalışmadım';
      if (currentStatus === 'Çalışmadım') {
        onUpdateTopicStatus(topicName, 'Çalıştım', false);
      }
    });
  }, [resources, topicStatuses, onUpdateTopicStatus]);
  const [mobileMatrixViewMode, setMobileMatrixViewMode] = useState<'table' | 'cards'>('table');
  const [showMobileStatusColumn, setShowMobileStatusColumn] = useState<boolean>(false);

  // Form State
  const [examType, setExamType] = useState<'TYT' | 'AYT' | ''>('');
  const [subject, setSubject] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [selectedInitialTopics, setSelectedInitialTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit State
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editExamType, setEditExamType] = useState<'TYT' | 'AYT'>('AYT');
  const [editSubject, setEditSubject] = useState('');
  const [editCompletedTopics, setEditCompletedTopics] = useState<string[]>([]);

  // Inline Notes Edit State
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [inlineNotesText, setInlineNotesText] = useState<string>('');
  const [confirmState, setConfirmState] = useState<{ bookId: string; action: 'select_all' | 'clear'; step: number } | null>(null);

  const mapSubjectToFilter = (subjectName: string): string => {
    const s = subjectName.toLowerCase();
    if (s.includes('matematik') || s.includes('problem')) return 'Matematik';
    if (s.includes('geometri')) return 'Geometri';
    if (s.includes('türkçe') || s.includes('edebiyat') || s.includes('türk dili') || s.includes('paragraf')) return 'Türkçe';
    if (s.includes('fizik')) return 'Fizik';
    if (s.includes('kimya')) return 'Kimya';
    if (s.includes('biyoloji')) return 'Biyoloji';
    if (s.includes('tarih')) return 'Tarih';
    if (s.includes('coğrafya')) return 'Coğrafya';
    if (s.includes('felsefe')) return 'Felsefe';
    if (s.includes('din')) return 'Din Kültürü';
    return 'Matematik'; // fallback
  };

  const handleSaveInlineNotes = (res: ResourceItem) => {
    onUpdateResource({
      ...res,
      notes: inlineNotesText,
    });
    setEditingNotesId(null);
  };

  const handleStartEdit = (res: ResourceItem) => {
    setEditingResource(res);
    setEditBookTitle(res.bookTitle);
    setEditPublisher(res.publisher);
    setEditNotes(res.notes || '');
    setEditExamType(res.examType);
    setEditSubject(res.subject);
    setEditCompletedTopics(res.completedTopics || []);
  };

  const handleEditExamTypeChange = (type: 'TYT' | 'AYT') => {
    setEditExamType(type);
    setEditSubject(YKS_SUBJECTS[type][0]);
    setEditCompletedTopics([]);
  };

  const handleEditSubjectChange = (newSub: string) => {
    setEditSubject(newSub);
    setEditCompletedTopics([]);
  };

  const handleToggleEditTopic = (topicName: string) => {
    setEditCompletedTopics((prev) => 
      prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]
    );
  };

  const handleUpdateResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !editBookTitle.trim()) return;

    const subjectTopics = getTopicsForResource(editSubject, editExamType);
    const totalUnitsCount = subjectTopics.length > 0 ? subjectTopics.length : 10;
    
    // filter topics that exist in the selected subject's curriculum to prevent orphaned states
    const finalCompletedTopics = editCompletedTopics.filter(t => subjectTopics.includes(t));
    const completedUnitsCount = finalCompletedTopics.length;

    onUpdateResource({
      ...editingResource,
      bookTitle: editBookTitle,
      publisher: editPublisher || 'Yayınevi',
      notes: editNotes,
      examType: editExamType,
      subject: editSubject,
      completedTopics: finalCompletedTopics,
      completedUnits: completedUnitsCount,
      totalUnits: totalUnitsCount,
      status: completedUnitsCount >= totalUnitsCount && totalUnitsCount > 0 
        ? 'completed' 
        : completedUnitsCount > 0 
        ? 'in_progress' 
        : 'not_started',
    });

    setEditingResource(null);
  };

  // Handle subject change in form
  const handleExamTypeChange = (type: 'TYT' | 'AYT' | '') => {
    setExamType(type);
    setSubject('');
    setBookTitle('');
    setPublisher('');
    setSelectedInitialTopics([]);
    setShowSuggestions(false);
  };

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    setBookTitle('');
    setPublisher('');
    setSelectedInitialTopics([]);
    setShowSuggestions(false);
  };

  const handleToggleInitialTopic = (topicName: string) => {
    setSelectedInitialTopics((prev) => 
      prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]
    );
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !subject || !examType) return;

    const subjectTopics = YKS_CURRICULUM_TOPICS[subject] || [];
    const totalUnitsCount = subjectTopics.length > 0 ? subjectTopics.length : 10;
    const completedUnitsCount = selectedInitialTopics.length;

    onAddResource({
      subject,
      bookTitle,
      publisher: publisher || 'Yayınevi',
      totalUnits: totalUnitsCount,
      completedUnits: completedUnitsCount,
      completedTopics: selectedInitialTopics,
      status: completedUnitsCount >= totalUnitsCount && totalUnitsCount > 0 ? 'completed' : completedUnitsCount > 0 ? 'in_progress' : 'not_started',
      examType: examType as 'TYT' | 'AYT',
      notes
    });

    setExamType('');
    setSubject('');
    setBookTitle('');
    setPublisher('');
    setNotes('');
    setSelectedInitialTopics([]);
    setShowSuggestions(false);
    setShowAddModal(false);
  };

  const toggleExpandBook = (bookId: string) => {
    setExpandedBookIds(prev => ({
      ...prev,
      [bookId]: !prev[bookId]
    }));
  };

  const handleToggleTopicForBook = (resource: ResourceItem, topicName: string) => {
    const currentCompleted = resource.completedTopics || [];
    const isCompleted = currentCompleted.includes(topicName);
    const updatedCompleted = isCompleted
      ? currentCompleted.filter(t => t !== topicName)
      : [...currentCompleted, topicName];

    const subjectTopics = getTopicsForResource(resource.subject, resource.examType);
    const totalCount = subjectTopics.length > 0 ? subjectTopics.length : Math.max(resource.totalUnits, updatedCompleted.length);
    const completedCount = updatedCompleted.length;

    const newStatus = completedCount >= totalCount && totalCount > 0
      ? 'completed'
      : completedCount > 0
      ? 'in_progress'
      : 'not_started';

    onUpdateResource({
      ...resource,
      completedTopics: updatedCompleted,
      completedUnits: completedCount,
      totalUnits: totalCount,
      status: newStatus
    });

    // Automatically update study status if any resource has completed this topic
    const nextResources = resources.map(book => {
      if (book.id === resource.id) {
        return {
          ...book,
          completedTopics: updatedCompleted
        };
      }
      return book;
    });

    const hasAnySolvedBook = nextResources.some(book => 
      book.completedTopics?.includes(topicName)
    );

    const currentStatus = topicStatuses[topicName] || 'Çalışmadım';
    const isManuallyChanged = manuallyChangedTopicStatuses?.includes(topicName);

    if (hasAnySolvedBook) {
      if (currentStatus === 'Çalışmadım') {
        onUpdateTopicStatus(topicName, 'Çalıştım', false);
      }
    } else {
      if (!isManuallyChanged && currentStatus === 'Çalıştım') {
        onUpdateTopicStatus(topicName, 'Çalışmadım', false);
      }
    }
  };

  const handleSelectAllTopics = (resource: ResourceItem) => {
    const subjectTopics = getTopicsForResource(resource.subject, resource.examType);
    if (subjectTopics.length === 0) return;

    onUpdateResource({
      ...resource,
      completedTopics: [...subjectTopics],
      completedUnits: subjectTopics.length,
      totalUnits: subjectTopics.length,
      status: 'completed'
    });
  };

  const handleClearAllTopics = (resource: ResourceItem) => {
    const subjectTopics = getTopicsForResource(resource.subject, resource.examType);
    const totalCount = subjectTopics.length > 0 ? subjectTopics.length : resource.totalUnits;

    onUpdateResource({
      ...resource,
      completedTopics: [],
      completedUnits: 0,
      totalUnits: totalCount,
      status: 'not_started'
    });
  };

  // Helper matching lists and matchers
  const DERS_FILTERS = [
    { value: 'all', label: 'Tüm Dersler' },
    { value: 'all_tyt', label: 'Tüm TYT Dersleri' },
    { value: 'all_ayt', label: 'Tüm AYT Dersleri' },
    { value: 'Matematik', label: 'Matematik' },
    { value: 'Geometri', label: 'Geometri' },
    { value: 'Türkçe', label: 'Türkçe / Edebiyat' },
    { value: 'Fizik', label: 'Fizik' },
    { value: 'Kimya', label: 'Kimya' },
    { value: 'Biyoloji', label: 'Biyoloji' },
    { value: 'Tarih', label: 'Tarih' },
    { value: 'Coğrafya', label: 'Coğrafya' },
    { value: 'Felsefe', label: 'Felsefe' },
    { value: 'Din Kültürü', label: 'Din Kültürü' }
  ];

  const matchesDersSubject = (
    bookOrSubject: string | { subject: string; examType?: string; bookTitle?: string },
    filterValue: string,
    examTypeParam?: string,
    bookTitleParam?: string
  ): boolean => {
    if (filterValue === 'all') return true;

    const bookSubject = typeof bookOrSubject === 'string' ? bookOrSubject : (bookOrSubject.subject || '');
    const examType = typeof bookOrSubject === 'string' ? examTypeParam : bookOrSubject.examType;
    const bookTitle = typeof bookOrSubject === 'string' ? bookTitleParam : bookOrSubject.bookTitle;

    const subLower = bookSubject.toLowerCase();
    const titleLower = (bookTitle || '').toLowerCase();
    const fLower = filterValue.toLowerCase();

    const effectiveExamType = examType || (
      subLower.includes('tyt') || titleLower.includes('tyt') ? 'TYT' :
      subLower.includes('ayt') || titleLower.includes('ayt') ? 'AYT' : ''
    );

    if (filterValue === 'all_tyt') {
      if (effectiveExamType === 'TYT') return true;
      if (effectiveExamType === 'AYT') return false;
      return subLower.includes('tyt') || subLower.includes('paragraf') || subLower.includes('problem') || titleLower.includes('tyt');
    }

    if (filterValue === 'all_ayt') {
      if (effectiveExamType === 'AYT') return true;
      if (effectiveExamType === 'TYT') return false;
      return subLower.includes('ayt') || subLower.includes('edebiyat') || titleLower.includes('ayt');
    }

    if (fLower === 'türkçe') {
      return subLower.includes('türkçe') || subLower.includes('edebiyat') || subLower.includes('türk dili') || subLower.includes('paragraf');
    }
    if (fLower === 'matematik') {
      return subLower.includes('matematik') || subLower.includes('problem');
    }
    if (fLower === 'din kültürü') {
      return subLower.includes('din') || subLower.includes('manevi');
    }

    return subLower.includes(fLower) || titleLower.includes(fLower);
  };

  // Filter resources based on current filters
  const filteredResources = resources.filter(book => {
    // 1. Filter by Ders
    let activeDersFilter = selectedDersFilter;
    if (selectedDersFilter === 'all_tyt' && selectedExamTypeFilter === 'AYT') {
      activeDersFilter = 'all_ayt';
    } else if (selectedDersFilter === 'all_ayt' && selectedExamTypeFilter === 'TYT') {
      activeDersFilter = 'all_tyt';
    }
    const matchesDers = matchesDersSubject(book, activeDersFilter);
    
    // 2. Filter by Exam Type
    let matchesExam = true;
    if (selectedExamTypeFilter !== 'all') {
      const bookExamType = book.examType || (book.subject.toLowerCase().includes('tyt') ? 'TYT' : book.subject.toLowerCase().includes('ayt') ? 'AYT' : (book.bookTitle?.toLowerCase().includes('tyt') ? 'TYT' : book.bookTitle?.toLowerCase().includes('ayt') ? 'AYT' : ''));
      matchesExam = bookExamType === selectedExamTypeFilter;
    }
    
    return matchesDers && matchesExam;
  });

  // Overall Stats based on filtered resources
  const totalBooks = filteredResources.length;
  const completedBooks = filteredResources.filter(r => r.status === 'completed').length;
  const inProgressBooks = filteredResources.filter(r => r.status === 'in_progress').length;
  
  let grandTotalTopics = 0;
  let grandCompletedTopics = 0;
  filteredResources.forEach(res => {
    const topics = getTopicsForResource(res.subject, res.examType);
    const total = topics.length > 0 ? topics.length : res.totalUnits;
    const completed = res.completedTopics ? res.completedTopics.length : res.completedUnits;
    grandTotalTopics += total;
    grandCompletedTopics += completed;
  });

  const overallPercent = grandTotalTopics > 0 ? Math.round((grandCompletedTopics / grandTotalTopics) * 100) : 0;

  const isSpecificCourseSelected = selectedDersFilter !== 'all' && selectedDersFilter !== 'all_tyt' && selectedDersFilter !== 'all_ayt' && selectedDersFilter !== 'none';
  const courseTopicsData = isSpecificCourseSelected ? getTopicsForSelectedDers(selectedDersFilter, selectedExamTypeFilter) : [];
  const totalCourseTopicsCount = courseTopicsData.reduce((acc, current) => acc + current.topics.length, 0);

  // Count books for Sınav Türü buttons (TYT, AYT, Tümü)
  const getExamTypeBookCount = (type: 'TYT' | 'AYT' | 'all') => {
    return resources.filter(book => {
      let activeDers = selectedDersFilter;
      if (['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter)) {
        if (type === 'all') activeDers = 'all';
        else if (type === 'TYT') activeDers = 'all_tyt';
        else if (type === 'AYT') activeDers = 'all_ayt';
      }

      const matchesDers = matchesDersSubject(book, activeDers);

      if (type === 'all') return matchesDers;

      const bookExam = book.examType || (book.subject.toLowerCase().includes('tyt') ? 'TYT' : book.subject.toLowerCase().includes('ayt') ? 'AYT' : (book.bookTitle?.toLowerCase().includes('tyt') ? 'TYT' : book.bookTitle?.toLowerCase().includes('ayt') ? 'AYT' : ''));
      return matchesDers && bookExam === type;
    }).length;
  };

  // Helper to count books for a specific subject filter
  const getSubjectBookCount = (filterValue: string) => {
    return resources.filter(book => {
      const matchesDers = matchesDersSubject(book, filterValue);
      let matchesExam = true;
      if (selectedExamTypeFilter !== 'all') {
        const bookExamType = book.examType || (book.subject.toLowerCase().includes('tyt') ? 'TYT' : book.subject.toLowerCase().includes('ayt') ? 'AYT' : (book.bookTitle?.toLowerCase().includes('tyt') ? 'TYT' : book.bookTitle?.toLowerCase().includes('ayt') ? 'AYT' : ''));
        matchesExam = bookExamType === selectedExamTypeFilter;
      }
      return matchesDers && matchesExam;
    }).length;
  };

  const specificSubjectFilters = DERS_FILTERS.filter(f => !['all', 'all_tyt', 'all_ayt'].includes(f.value));

  const standardSubjectButtons = specificSubjectFilters.map(filter => {
    const count = getSubjectBookCount(filter.value);
    return { value: filter.value, label: filter.label, count };
  }).filter(item => item.count > 0);

  const customSubjectsNotInStandard: { value: string; label: string; count: number }[] = [];
  resources.forEach(book => {
    const matched = specificSubjectFilters.some(f => matchesDersSubject(book, f.value));
    if (!matched && book.subject) {
      const existing = customSubjectsNotInStandard.find(c => c.value.toLowerCase() === book.subject.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        customSubjectsNotInStandard.push({ value: book.subject, label: book.subject, count: 1 });
      }
    }
  });

  const activeSubjectButtons = [...standardSubjectButtons, ...customSubjectsNotInStandard];

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* ── HERO HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>YKS Konu & Kaynak Takip Sistemi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <BookOpenCheck className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Kaynak Takibi (Konu Bazlı)</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Müfredat konu listenizdeki konuları kaynak kitaplarınızla eşleştirerek soru çözme tamamlama oranınızı adım adım takip edin.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 z-10">
          <button
            onClick={() => setShowAddModal(true)}
            id="add-resource-book-btn"
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer border border-indigo-400/30 group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Yeni Kitap Ekle</span>
          </button>
        </div>
      </div>

      {/* ── 4 TOP KPI METRIC CARDS (KOMPAKT MİNİ İSTATİSTİK ŞERİDİ) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Kayıtlı Kaynak Kitaplar */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-md backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Kaynak Kitap</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-white font-mono">{totalBooks}</span>
                <span className="text-[10px] text-slate-500">Kitap</span>
              </div>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0 hidden sm:inline" title={`Devam Eden: ${inProgressBooks}, Başlanmamış: ${totalBooks - completedBooks - inProgressBooks}`}>
            {completedBooks} Bitirildi
          </span>
        </div>

        {/* Card 2: Toplam Çözülen Konular */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-md backdrop-blur-md relative overflow-hidden group hover:border-fuchsia-500/40 transition-all">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
              <ListChecks className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">Konu İlerlemesi</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-fuchsia-400 font-mono">{grandCompletedTopics}</span>
                <span className="text-[10px] text-slate-500">/ {grandTotalTopics}</span>
              </div>
            </div>
          </div>
          <span className="text-[9px] bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0 hidden sm:inline">
            %{overallPercent} Tamamlandı
          </span>
        </div>

        {/* Card 3: TYT Kitap Sayısı */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-md backdrop-blur-md relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">TYT Kaynakları</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-sky-400 font-mono">{getExamTypeBookCount('TYT')}</span>
                <span className="text-[10px] text-slate-500">Kitap</span>
              </div>
            </div>
          </div>
          <span className="text-[9px] bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0 hidden sm:inline">
            TYT Müfredatı
          </span>
        </div>

        {/* Card 4: AYT Kitap Sayısı */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between shadow-md backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-400 block truncate">AYT Kaynakları</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">{getExamTypeBookCount('AYT')}</span>
                <span className="text-[10px] text-slate-500">Kitap</span>
              </div>
            </div>
          </div>
          <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold font-mono shrink-0 hidden sm:inline">
            AYT Müfredatı
          </span>
        </div>
      </div>

      {/* Main Persistent Top Navigation Tabs: Kaynaklarım / Konularım */}
      <div className="flex bg-slate-950 p-1.5 rounded-3xl border border-slate-800 items-center gap-2 w-full shadow-xl">
        <button
          onClick={() => {
            setTrackerTab('resources');
            setSelectedDersFilter('all');
            setSelectedExamTypeFilter('all');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            trackerTab === 'resources'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/30 ring-1 ring-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span>Kaynaklarım ({totalBooks})</span>
        </button>
        <button
          onClick={() => {
            setTrackerTab('topics');
            if (selectedExamTypeFilter === 'all') {
              setSelectedExamTypeFilter('TYT');
            }
            if (['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter)) {
              setSelectedDersFilter('none');
            }
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            trackerTab === 'topics'
              ? 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/20 border border-fuchsia-500/30 ring-1 ring-fuchsia-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <ListChecks className="w-4.5 h-4.5" />
          <span>Konularım & Matris</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ders Seçimi */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Ders Seçimi</span>
            </label>
            <div className="relative">
              <select
                value={selectedDersFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDersFilter(val);
                  if (val === 'all') {
                    setSelectedExamTypeFilter('all');
                  } else if (val === 'all_tyt') {
                    setSelectedExamTypeFilter('TYT');
                  } else if (val === 'all_ayt') {
                    setSelectedExamTypeFilter('AYT');
                  }
                }}
                className="w-full bg-slate-950 text-slate-200 text-sm font-semibold rounded-xl border border-slate-800 px-4 py-3 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-colors"
              >
                {trackerTab === 'topics' ? (
                  <>
                    <option value="none">
                      -- Lütfen Bir Ders Seçiniz --
                    </option>
                    {DERS_FILTERS.filter(f => !['all', 'all_tyt', 'all_ayt'].includes(f.value)).map(filter => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </>
                ) : (
                  DERS_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Sınav Türü */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>
              <span>Sınav Türü</span>
            </label>
            <div className={`flex bg-slate-950 p-1 rounded-xl border border-slate-800 h-[46px] items-center ${trackerTab === 'topics' ? 'grid grid-cols-2' : ''}`}>
              <button
                onClick={() => {
                  setSelectedExamTypeFilter('TYT');
                  if (['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter)) {
                    setSelectedDersFilter('all_tyt');
                  }
                }}
                className={`flex-1 h-full text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedExamTypeFilter === 'TYT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <span>TYT</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedExamTypeFilter === 'TYT' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {getExamTypeBookCount('TYT')}
                </span>
              </button>
              <button
                onClick={() => {
                  setSelectedExamTypeFilter('AYT');
                  if (['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter)) {
                    setSelectedDersFilter('all_ayt');
                  }
                }}
                className={`flex-1 h-full text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedExamTypeFilter === 'AYT'
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <span>AYT</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedExamTypeFilter === 'AYT' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {getExamTypeBookCount('AYT')}
                </span>
              </button>
              {trackerTab !== 'topics' && (
                <button
                  onClick={() => {
                    setSelectedExamTypeFilter('all');
                    if (['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter)) {
                      setSelectedDersFilter('all');
                    }
                  }}
                  className={`flex-1 h-full text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedExamTypeFilter === 'all'
                      ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <span>Tümü</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    selectedExamTypeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {getExamTypeBookCount('all')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Small Subject Chips with Book Count when a 'Tüm' option is selected */}
        {['all', 'all_tyt', 'all_ayt'].includes(selectedDersFilter) && activeSubjectButtons.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Kaynak Ekli Dersler:</span>
            </span>
            {activeSubjectButtons.map(sub => (
              <button
                key={sub.value}
                type="button"
                onClick={() => setSelectedDersFilter(sub.value)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-indigo-600/20 text-slate-200 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm group"
              >
                <span>{sub.label}</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/20 group-hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-md">
                  {sub.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: RESOURCE BOOKS */}
      {trackerTab === 'resources' && (
        <div className="space-y-6">
            {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-indigo-400">Çözülen Kitaplar</div>
                <div className="text-xl font-black text-white mt-1 font-mono">{completedBooks} / {totalBooks}</div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all" 
                    style={{ width: `${totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}%` }} 
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{inProgressBooks} Devam Eden</span>
                  <span>%{totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-emerald-400">Çözülen Konu Sayısı</div>
                <div className="text-xl font-black text-emerald-300 mt-1 font-mono">{grandCompletedTopics} / {grandTotalTopics}</div>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-2">Müfredat Konusu</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-amber-400">Genel Tamamlanma</div>
                <div className="text-xl font-black text-amber-300 mt-1 font-mono">%{overallPercent}</div>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Books List Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredResources.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <BookOpenCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">
                  {resources.length === 0 
                    ? "Henüz Eklenmiş Kaynak Kitap Bulunmuyor" 
                    : "Seçilen Filtrelere Uygun Kitap Bulunamadı"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {resources.length === 0 
                    ? 'Yukarıdaki "Yeni Kitap Ekle" butonuna tıklayarak YKS soru bankalarınızı ekleyip konu bazlı takibinizi başlatabilirsiniz.'
                    : 'Seçtiğiniz ders veya sınav türü filtresine uyan bir kaynak bulunmuyor. Filtreleri temizleyebilir veya bu kategoriye yeni bir kitap ekleyebilirsiniz.'}
                </p>
                {resources.length > 0 ? (
                  <button
                    onClick={() => {
                      setSelectedDersFilter('all');
                      setSelectedExamTypeFilter('all');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
                  >
                    Filtreleri Temizle
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    İlk Kitabını Ekle
                  </button>
                )}
              </div>
            ) : (
              filteredResources.map((res) => {
                const subjectTopics = getTopicsForResource(res.subject, res.examType);
                const completedTopics = res.completedTopics || [];
                
                const totalTopicCount = subjectTopics.length > 0 ? subjectTopics.length : Math.max(res.totalUnits, 1);
                const completedTopicCount = completedTopics.length > 0 ? completedTopics.length : res.completedUnits;
                const percent = Math.min(100, Math.round((completedTopicCount / totalTopicCount) * 100));

                const isExpanded = !!expandedBookIds[res.id];
                const searchQuery = topicSearchQuery[res.id] || '';

                const filteredTopics = subjectTopics.filter(t => 
                  t.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <div
                    key={res.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div 
                        onClick={() => handleStartEdit(res)}
                        className="flex-1 cursor-pointer group/book-info space-y-1"
                        title="Kitap bilgilerini düzenlemek için tıklayın"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                            {res.subject} • {res.examType}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            res.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : res.status === 'in_progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {res.status === 'completed' ? 'Tamamlandı (%100)' : res.status === 'in_progress' ? 'Çözülüyor' : 'Başlanmadı'}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2 group-hover/book-info:text-indigo-400 transition-colors">
                          <span>{res.bookTitle}</span>
                          <Pencil className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/book-info:opacity-100 transition-all shrink-0" />
                        </h3>
                        <p className="text-xs text-slate-400 font-medium group-hover/book-info:text-slate-300 transition-colors">{res.publisher}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 self-end sm:self-center shrink-0">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStartEdit(res)}
                            title="Bilgileri Düzenle"
                            className="text-slate-400 hover:text-indigo-400 p-2 bg-slate-800 hover:bg-indigo-500/10 border border-slate-700 rounded-xl transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleExpandBook(res.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isExpanded
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
                            }`}
                          >
                            <ListChecks className="w-4 h-4" />
                            <span>{isExpanded ? 'Konu Listesini Gizle' : 'Konu Listesini Aç'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setDeletingResource({ id: res.id, title: `${res.bookTitle} (${res.subject})` })}
                            title="Kitabı Sil"
                            className="text-slate-500 hover:text-rose-400 p-2 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/60 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {isExpanded && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrackerTab('topics');
                              const mappedDers = mapSubjectToFilter(res.subject);
                              setSelectedDersFilter(mappedDers);
                              setSelectedExamTypeFilter(res.examType || 'all');
                            }}
                            className="text-[10px] font-medium text-slate-400 hover:text-fuchsia-400 bg-transparent hover:bg-fuchsia-500/10 px-2 py-0.5 rounded-md border border-slate-800/80 hover:border-fuchsia-500/30 transition-all flex items-center gap-1 cursor-pointer opacity-70 hover:opacity-100"
                          >
                            <Table className="w-3 h-3 text-fuchsia-400" />
                            <span>Ders Tablosunu Aç</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Topic Stats */}
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-slate-300 font-mono">
                        <span className="flex items-center space-x-1.5 text-slate-400">
                          <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Çözülen Konu Oranı:</span>
                        </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {completedTopicCount} / {totalTopicCount} Konu (%{percent})
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent === 100 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Kitap Notu (Çözülen Konu Oranı kutusunun altında) */}
                    {editingNotesId === res.id ? (
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-indigo-500/50">
                        <input
                          type="text"
                          value={inlineNotesText}
                          onChange={(e) => setInlineNotesText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveInlineNotes(res);
                            } else if (e.key === 'Escape') {
                              setEditingNotesId(null);
                            }
                          }}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none px-2 py-1"
                          placeholder="Kitap notu yazın..."
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInlineNotes(res)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="text-slate-400 hover:text-white text-[11px] px-2 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <p 
                        onClick={() => {
                          setEditingNotesId(res.id);
                          setInlineNotesText(res.notes || '');
                        }}
                        className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 cursor-pointer hover:border-indigo-500/30 hover:bg-slate-950 transition-all flex items-center justify-between group/notes"
                        title="Kitap notunu düzenlemek için tıklayın"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-semibold shrink-0">Kitap Notu:</span>
                          <span className={res.notes ? "" : "text-slate-500 italic"}>
                            {res.notes || 'Not eklemek için tıklayın...'}
                          </span>
                        </span>
                        <Pencil className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/notes:opacity-100 transition-all shrink-0 ml-2" />
                      </p>
                    )}

                    {/* EXPANDABLE TOPIC CHECKLIST FOR THIS BOOK WITH SLIDE DOWN/UP ANIMATION */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (() => {
                        const unsolvedTopics = filteredTopics.filter(t => !completedTopics.includes(t));
                        const solvedTopics = filteredTopics.filter(t => completedTopics.includes(t));

                        return (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                                  <ListChecks className="w-4 h-4 text-indigo-400" />
                                  <span>{res.subject} Müfredat Konu Çözüm Listesi</span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Bu soru bankasında tamamladığınız konuları kutucuklara tıklayarak işaretleyin.
                                </p>
                              </div>

                              {confirmState && confirmState.bookId === res.id ? (
                                <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-sm animate-in fade-in duration-200">
                                  <span className="text-[11px] text-amber-400 font-bold shrink-0">
                                    {confirmState.action === 'select_all' 
                                      ? (confirmState.step === 1 ? '1/2 Onay: Tüm konular seçilsin mi?' : '2/2 Son Onay: Emin misiniz?') 
                                      : (confirmState.step === 1 ? '1/2 Onay: Tüm işaretlemeler silinsin mi?' : '2/2 Son Onay: Emin misiniz?')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirmState.step === 1) {
                                        setConfirmState({ ...confirmState, step: 2 });
                                      } else {
                                        if (confirmState.action === 'select_all') {
                                          handleSelectAllTopics(res);
                                        } else {
                                          handleClearAllTopics(res);
                                        }
                                        setConfirmState(null);
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[10px] font-black transition-all cursor-pointer"
                                  >
                                    {confirmState.step === 1 ? 'Evet' : 'Eminim, Onayla'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmState(null)}
                                    className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold transition-all border border-slate-700/50 cursor-pointer"
                                  >
                                    Vazgeç
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmState({ bookId: res.id, action: 'select_all', step: 1 })}
                                    className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    Tümünü Seç
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmState({ bookId: res.id, action: 'clear', step: 1 })}
                                    className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    Temizle
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Search topics in book */}
                            {subjectTopics.length > 6 && (
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="text"
                                  placeholder="Konu ara... (Ör: Türev, Paragraf)"
                                  value={searchQuery}
                                  onChange={(e) => setTopicSearchQuery(prev => ({ ...prev, [res.id]: e.target.value }))}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            )}

                            {/* Topics Grid - Separated by Solved vs To-Be-Solved */}
                            {subjectTopics.length === 0 ? (
                              <div className="text-xs text-slate-400 italic p-3 text-center">
                                Bu ders için özel konu listesi bulunamadı. Genel sayaç ile takip edilmektedir.
                              </div>
                            ) : (
                              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                                {/* SECTION 1: Çözülecek Konular (Bekleyenler) */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                                      <Square className="w-3.5 h-3.5" />
                                      <span>Çözülecek Konular ({unsolvedTopics.length})</span>
                                    </span>
                                    {unsolvedTopics.length > 0 && (
                                      <span className="text-[10px] text-amber-300/80 font-mono font-medium">
                                        Kalan: {unsolvedTopics.length} Konu
                                      </span>
                                    )}
                                  </div>

                                  {unsolvedTopics.length === 0 ? (
                                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-300 font-semibold flex items-center justify-center space-x-2">
                                      <Check className="w-4 h-4 text-emerald-400" />
                                      <span>Tebrikler! Bu kitaptaki tüm müfredat konuları çözüldü (%100).</span>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {unsolvedTopics.map((topicName) => (
                                        <button
                                          key={topicName}
                                          type="button"
                                          onClick={() => handleToggleTopicForBook(res, topicName)}
                                          className="flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700 cursor-pointer group"
                                        >
                                          <Square className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                          <span className="text-xs font-medium">{topicName}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* SECTION 2: Çözülen Konular (Tamamlananlar) */}
                                <div className="space-y-2 pt-3 border-t border-slate-800/60">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                                      <CheckSquare className="w-3.5 h-3.5" />
                                      <span>Çözülen Konular ({solvedTopics.length})</span>
                                    </span>
                                    {solvedTopics.length > 0 && (
                                      <span className="text-[10px] text-emerald-300/80 font-mono font-medium">
                                        Tamamlanan: {solvedTopics.length} Konu
                                      </span>
                                    )}
                                  </div>

                                  {solvedTopics.length === 0 ? (
                                    <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500 italic">
                                      Henüz işaretlenmiş çözülen konu bulunmuyor.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {solvedTopics.map((topicName) => (
                                        <button
                                          key={topicName}
                                          type="button"
                                          onClick={() => handleToggleTopicForBook(res, topicName)}
                                          className="flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all bg-emerald-950/30 border-emerald-500/30 text-emerald-200 hover:bg-emerald-950/50 hover:border-emerald-500/50 cursor-pointer group"
                                        >
                                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                          <span className="text-xs font-medium line-through opacity-80 group-hover:opacity-100 transition-opacity">
                                            {topicName}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: TOPICS MATRIX OR COURSE SELECTION PROMPT */}
      {trackerTab === 'topics' && (
        <div className="space-y-6">
          {isSpecificCourseSelected ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-5 shadow-lg space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <ListChecks className="w-5 h-5 text-indigo-400" />
                    <span>Konu Çalışma & Kaynak Analiz Matrisi ({selectedDersFilter})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Bu dersin tüm müfredat konularındaki durumunuzu seçin ve kaynak kitaplarınızda çözdüğünüz konuları tek ekrandan analiz edin.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Toplam Konu: <strong className="text-white">{totalCourseTopicsCount}</strong></span>
                  
                  {/* Mobile View & Column Selector */}
                  <div className="flex md:hidden items-center gap-1.5 ml-auto">
                    {/* Mobile Status Column Toggle Button */}
                    {mobileMatrixViewMode === 'table' && (
                      <button
                        type="button"
                        onClick={() => setShowMobileStatusColumn(!showMobileStatusColumn)}
                        className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          showMobileStatusColumn
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Mobilde Çalışma Durumu sütununu göster/gizle"
                      >
                        <span>{showMobileStatusColumn ? 'Durum: Açık' : 'Durum: Gizli'}</span>
                      </button>
                    )}

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMobileMatrixViewMode('table')}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          mobileMatrixViewMode === 'table'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Tablo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileMatrixViewMode('cards')}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          mobileMatrixViewMode === 'cards'
                            ? 'bg-fuchsia-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Kartlar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Orientation Helper Banner */}
              {mobileMatrixViewMode === 'table' && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium lg:hidden">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 rotate-90 animate-pulse" />
                    <span>
                      Tabloyu daha rahat görmek için <strong>telefonunuzu yan çevirebilirsiniz (yatay mod)</strong>. Konu başlığı sol tarafta sabit kalır.
                    </span>
                  </div>
                </div>
              )}

              {/* Matrix Table View (Desktop or Mobile Table Mode) */}
              <div className={`${mobileMatrixViewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto touch-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner custom-scrollbar`}>
                <table className="w-full text-left border-collapse min-w-[300px] lg:min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-[11px] lg:text-xs font-bold text-slate-300">
                      <th className="sticky left-0 z-20 bg-slate-900 px-1.5 lg:px-4 py-2.5 min-w-[95px] lg:min-w-[220px] max-w-[130px] lg:max-w-[260px] border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.4)]">
                        Müfredat Konuları
                      </th>
                      <th className={`${showMobileStatusColumn ? 'table-cell' : 'hidden lg:table-cell'} px-1 lg:px-4 py-2.5 text-center lg:text-left min-w-[36px] lg:min-w-[170px]`}>
                        <span className="hidden lg:inline">Çalışma Durumu</span>
                        <span className="lg:hidden text-[10px] text-slate-400" title="Çalışma Durumu">Durum</span>
                      </th>
                      {/* Dynamic book columns */}
                      {filteredResources.map(book => (
                        <th key={book.id} className="px-0.5 lg:px-4 py-1.5 lg:py-3 text-center min-w-[32px] lg:min-w-[130px] max-w-[50px] lg:max-w-[140px] align-bottom" title={`${book.bookTitle} (${book.publisher})`}>
                          <div className="flex flex-col items-center justify-end h-[95px] lg:h-auto pb-1">
                            <div className="text-[10px] lg:text-[11px] font-extrabold text-indigo-300 [writing-mode:vertical-rl] rotate-180 lg:[writing-mode:horizontal-tb] lg:rotate-0 whitespace-nowrap truncate max-h-[85px] lg:max-h-none tracking-tight">
                              {book.bookTitle}
                            </div>
                            <div className="text-[8px] lg:text-[9px] text-slate-500 font-medium hidden lg:block truncate mt-0.5">{book.publisher}</div>
                          </div>
                        </th>
                      ))}
                      {filteredResources.length === 0 && (
                        <th className="px-1.5 lg:px-4 py-2.5 text-slate-500 text-xs italic font-medium min-w-[70px] lg:min-w-[120px]">Kaynak Yok</th>
                      )}
                      <th className="px-1 lg:px-4 py-2.5 text-center min-w-[65px] lg:min-w-[160px]">
                        <span className="hidden lg:inline">Durum İlerlemesi</span>
                        <span className="lg:hidden text-[10px] text-slate-400">İlerleme</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {courseTopicsData.map((section) => (
                      <React.Fragment key={section.key}>
                        {/* Category Header Row */}
                        <tr className="bg-slate-900/80 text-xs font-black text-indigo-400/90 select-none">
                          <td colSpan={99} className="sticky left-0 z-10 bg-slate-900/90 backdrop-blur-sm px-3 lg:px-4 py-2 uppercase tracking-widest font-mono text-[9px] lg:text-[10px] border-r border-slate-800/60">
                            {section.key}
                          </td>
                        </tr>
                        {section.topics.map((topicName, topicIdx) => {
                          const isTopicSolvedInAnyResource = (resources || []).some(book => book.completedTopics?.includes(topicName));
                          const rawStatus = topicStatuses[topicName] || 'Çalışmadım';
                          const currentStatus = (isTopicSolvedInAnyResource && rawStatus === 'Çalışmadım') ? 'Çalıştım' : rawStatus;
                          const totalMatchingBooks = filteredResources.length;
                          const solvedInBooks = filteredResources.filter(book => book.completedTopics?.includes(topicName)).length;
                          const solvedPercent = totalMatchingBooks > 0 ? Math.round((solvedInBooks / totalMatchingBooks) * 100) : 0;

                          let statusBadgeStyle = '';
                          let statusPercent = 0;
                          switch (currentStatus) {
                            case 'Uzmanlaştım':
                              statusBadgeStyle = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
                              statusPercent = 100;
                              break;
                            case 'Çalıştım':
                              statusBadgeStyle = 'border-sky-500/20 bg-sky-500/10 text-sky-400';
                              statusPercent = 80;
                              break;
                            case 'Zor Geldi':
                              statusBadgeStyle = 'border-purple-500/20 bg-purple-500/10 text-purple-400';
                              statusPercent = 40;
                              break;
                            case 'Erteledim':
                              statusBadgeStyle = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
                              statusPercent = 20;
                              break;
                            default:
                              statusBadgeStyle = 'border-slate-800 bg-slate-900 text-slate-500';
                              statusPercent = 0;
                              break;
                          }

                          const isEvenRow = topicIdx % 2 === 0;

                          return (
                            <tr 
                              key={topicName} 
                              className={`group transition-colors text-xs text-slate-300 ${
                                isEvenRow ? 'bg-slate-950/80 hover:bg-slate-900' : 'bg-slate-900/40 hover:bg-slate-900'
                              }`}
                            >
                              <td 
                                className={`sticky left-0 z-10 transition-colors px-1.5 lg:px-4 py-2 font-semibold text-[11px] lg:text-xs text-slate-200 border-r border-slate-800/80 shadow-[2px_0_5px_rgba(0,0,0,0.4)] break-words min-w-[95px] lg:min-w-[220px] max-w-[130px] lg:max-w-[260px] ${
                                  isEvenRow ? 'bg-slate-950 group-hover:bg-slate-900' : 'bg-slate-900/95 group-hover:bg-slate-900'
                                }`}
                              >
                                {topicName}
                              </td>

                              <td className={`${showMobileStatusColumn ? 'table-cell' : 'hidden lg:table-cell'} px-0.5 lg:px-4 py-2 min-w-[36px] lg:min-w-[160px] text-center lg:text-left`}>
                                {/* Desktop view select with text label */}
                                <select
                                  value={currentStatus}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    if (isTopicSolvedInAnyResource && val === 'Çalışmadım') return;
                                    onUpdateTopicStatus(topicName, val, true);
                                  }}
                                  className={`hidden lg:block w-full text-[10px] lg:text-[11px] font-bold rounded-lg px-2 lg:px-2.5 py-1.5 focus:outline-none border cursor-pointer transition-all ${statusBadgeStyle}`}
                                >
                                  <option value="Çalışmadım" disabled={isTopicSolvedInAnyResource} className={isTopicSolvedInAnyResource ? "bg-slate-900 text-slate-600 font-semibold italic opacity-50" : "bg-slate-900 text-slate-400 font-semibold"}>
                                    ⚪ Çalışmadım {isTopicSolvedInAnyResource ? '(Test Çözüldü - Pasif)' : ''}
                                  </option>
                                  <option value="Erteledim" className="bg-slate-900 text-amber-400 font-semibold">🟡 Erteledim</option>
                                  <option value="Zor Geldi" className="bg-slate-900 text-purple-400 font-semibold">🟣 Zor Geldi</option>
                                  <option value="Çalıştım" className="bg-slate-900 text-sky-400 font-semibold">🔵 Çalıştım</option>
                                  <option value="Uzmanlaştım" className="bg-slate-900 text-emerald-400 font-semibold">🌟 Uzmanlaştım</option>
                                </select>

                                {/* Mobile view dot-only trigger */}
                                <div className="relative lg:hidden inline-flex items-center justify-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${statusBadgeStyle} shadow-sm`}>
                                    {currentStatus === 'Uzmanlaştım' && '🌟'}
                                    {currentStatus === 'Çalıştım' && '🔵'}
                                    {currentStatus === 'Zor Geldi' && '🟣'}
                                    {currentStatus === 'Erteledim' && '🟡'}
                                    {currentStatus === 'Çalışmadım' && '⚪'}
                                  </div>
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => {
                                      const val = e.target.value as any;
                                      if (isTopicSolvedInAnyResource && val === 'Çalışmadım') return;
                                      onUpdateTopicStatus(topicName, val, true);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title={`Çalışma Durumu: ${currentStatus}`}
                                  >
                                    <option value="Çalışmadım" disabled={isTopicSolvedInAnyResource}>
                                      ⚪ Çalışmadım {isTopicSolvedInAnyResource ? '(Test Çözüldü - Pasif)' : ''}
                                    </option>
                                    <option value="Erteledim">🟡 Erteledim</option>
                                    <option value="Zor Geldi">🟣 Zor Geldi</option>
                                    <option value="Çalıştım">🔵 Çalıştım</option>
                                    <option value="Uzmanlaştım">🌟 Uzmanlaştım</option>
                                  </select>
                                </div>
                              </td>

                              {filteredResources.map(book => {
                                const isCompleted = book.completedTopics?.includes(topicName);
                                return (
                                  <td key={book.id} className="px-0.5 lg:px-4 py-1.5 lg:py-2.5 text-center min-w-[32px] lg:min-w-[120px]">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTopicForBook(book, topicName)}
                                      className={`p-1.5 lg:p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                        isCompleted 
                                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                          : 'bg-slate-900/50 border-slate-800/80 text-slate-600 hover:text-slate-400 hover:border-slate-700'
                                      }`}
                                      title={`Tıklayarak "${book.bookTitle}" için işaretleyin`}
                                    >
                                      <Check className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isCompleted ? 'opacity-100' : 'opacity-0 hover:opacity-30'}`} />
                                    </button>
                                  </td>
                                );
                              })}
                              {filteredResources.length === 0 && (
                                <td className="px-1.5 lg:px-4 py-2 text-slate-500 italic text-[10px] lg:text-[11px]">
                                  Kaynak Yok
                                </td>
                              )}

                              <td className="px-1 lg:px-4 py-2 min-w-[65px] lg:min-w-[160px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-mono">
                                    <span className="text-slate-400">
                                      {totalMatchingBooks > 0 ? 'Kaynak:' : 'Çalışma:'}
                                    </span>
                                    <span className="font-bold text-slate-300">
                                      %{totalMatchingBooks > 0 ? solvedPercent : statusPercent}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        (totalMatchingBooks > 0 ? solvedPercent : statusPercent) === 100 
                                          ? 'bg-emerald-500' 
                                          : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) >= 75 
                                          ? 'bg-sky-500' 
                                          : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) >= 40 
                                          ? 'bg-indigo-500' 
                                          : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) > 0 
                                          ? 'bg-amber-500' 
                                          : 'bg-slate-700'
                                      }`} 
                                      style={{ width: `${totalMatchingBooks > 0 ? solvedPercent : statusPercent}%` }} 
                                    />
                                  </div>
                                  {totalMatchingBooks > 0 && (
                                    <div className="flex items-center justify-between text-[9px] font-mono pt-0.5">
                                      <span className="text-slate-500">Çözülen:</span>
                                      <span className={`font-bold ${solvedPercent === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {solvedInBooks}/{totalMatchingBooks}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile-Responsive Touch-Friendly Card List View */}
              <div className={`${mobileMatrixViewMode === 'cards' ? 'block md:hidden' : 'hidden'} space-y-6`}>
                {courseTopicsData.map((section) => (
                  <div key={section.key} className="space-y-3">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-1 mt-2">
                      {section.key}
                    </div>
                    {section.topics.map((topicName) => {
                      const isTopicSolvedInAnyResource = (resources || []).some(book => book.completedTopics?.includes(topicName));
                      const rawStatus = topicStatuses[topicName] || 'Çalışmadım';
                      const currentStatus = (isTopicSolvedInAnyResource && rawStatus === 'Çalışmadım') ? 'Çalıştım' : rawStatus;
                      const totalMatchingBooks = filteredResources.length;
                      const solvedInBooks = filteredResources.filter(book => book.completedTopics?.includes(topicName)).length;
                      const solvedPercent = totalMatchingBooks > 0 ? Math.round((solvedInBooks / totalMatchingBooks) * 100) : 0;
                      
                      let statusBadgeStyle = '';
                      let statusPercent = 0;
                      switch (currentStatus) {
                        case 'Uzmanlaştım':
                          statusBadgeStyle = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
                          statusPercent = 100;
                          break;
                        case 'Çalıştım':
                          statusBadgeStyle = 'border-sky-500/20 bg-sky-500/10 text-sky-400';
                          statusPercent = 80;
                          break;
                        case 'Zor Geldi':
                          statusBadgeStyle = 'border-purple-500/20 bg-purple-500/10 text-purple-400';
                          statusPercent = 40;
                          break;
                        case 'Erteledim':
                          statusBadgeStyle = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
                          statusPercent = 20;
                          break;
                        default:
                          statusBadgeStyle = 'border-slate-800 bg-slate-900 text-slate-500';
                          statusPercent = 0;
                          break;
                      }

                      return (
                        <div key={topicName} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-extrabold text-white leading-tight">{topicName}</h4>
                          </div>

                          {/* Çalışma Durumu Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Çalışma Durumu</label>
                            <select
                              value={currentStatus}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                if (isTopicSolvedInAnyResource && val === 'Çalışmadım') return;
                                onUpdateTopicStatus(topicName, val, true);
                              }}
                              className={`w-full text-[11px] font-bold rounded-xl px-3 py-2.5 focus:outline-none border cursor-pointer transition-all ${statusBadgeStyle}`}
                            >
                              <option value="Çalışmadım" disabled={isTopicSolvedInAnyResource} className={isTopicSolvedInAnyResource ? "bg-slate-900 text-slate-600 font-semibold italic opacity-50" : "bg-slate-900 text-slate-400 font-semibold"}>
                                ⚪ Çalışmadım {isTopicSolvedInAnyResource ? '(Test Çözüldü - Pasif)' : ''}
                              </option>
                              <option value="Erteledim" className="bg-slate-900 text-amber-400 font-semibold">🟡 Erteledim</option>
                              <option value="Zor Geldi" className="bg-slate-900 text-purple-400 font-semibold">🟣 Zor Geldi</option>
                              <option value="Çalıştım" className="bg-slate-900 text-sky-400 font-semibold">🔵 Çalıştım</option>
                              <option value="Uzmanlaştım" className="bg-slate-900 text-emerald-400 font-semibold">🌟 Uzmanlaştım</option>
                            </select>
                          </div>

                          {/* Resources completion checklists for this topic on mobile */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Kaynak Kitaplar</label>
                            {filteredResources.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2">
                                {filteredResources.map(book => {
                                  const isCompleted = book.completedTopics?.includes(topicName);
                                  return (
                                    <button
                                      key={book.id}
                                      type="button"
                                      onClick={() => handleToggleTopicForBook(book, topicName)}
                                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                        isCompleted 
                                          ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-300' 
                                          : 'bg-slate-900/40 border-slate-900/80 text-slate-400'
                                      }`}
                                    >
                                      <div className="min-w-0 pr-2">
                                        <div className="text-[11px] font-bold text-slate-200 truncate">{book.bookTitle}</div>
                                        <div className="text-[9px] text-slate-500 font-medium truncate">{book.publisher}</div>
                                      </div>
                                      <div className={`p-1.5 rounded-lg border shrink-0 ${
                                        isCompleted 
                                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                                          : 'bg-slate-800 border-slate-700 text-slate-500'
                                      }`}>
                                        <Check className="w-3.5 h-3.5" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic p-2.5 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
                                Ders için ekli kitap yok
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-900">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-slate-400">
                                {totalMatchingBooks > 0 ? 'Kaynak Çözülme Oranı:' : 'Çalışma İlerlemesi:'}
                              </span>
                              <span className="font-bold text-slate-300">
                                %{totalMatchingBooks > 0 ? solvedPercent : statusPercent}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  (totalMatchingBooks > 0 ? solvedPercent : statusPercent) === 100 
                                    ? 'bg-emerald-500' 
                                    : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) >= 75 
                                    ? 'bg-sky-500' 
                                    : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) >= 40 
                                    ? 'bg-indigo-500' 
                                    : (totalMatchingBooks > 0 ? solvedPercent : statusPercent) > 0 
                                    ? 'bg-amber-500' 
                                    : 'bg-slate-700'
                                }`} 
                                style={{ width: `${totalMatchingBooks > 0 ? solvedPercent : statusPercent}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mx-auto text-fuchsia-400 shadow-inner">
                <BookOpenCheck className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-white">Lütfen Bir Ders Seçin</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Müfredat konularınızı listelemek ve konu bazlı soru bankası analizini başlatmak için lütfen yukarıdaki menüden veya aşağıdaki ders kartlarından birini seçin.
                </p>
              </div>

              {/* Quick Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 max-w-3xl mx-auto">
                {QUICK_COURSES.map(course => (
                  <button
                    key={course.value}
                    type="button"
                    onClick={() => setSelectedDersFilter(course.value)}
                    className="group p-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-pointer shadow-sm hover:shadow-indigo-500/5"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-110 transition-transform`}>
                      {course.label.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors text-center">
                      {course.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD NEW RESOURCE BOOK WITH STEP-BY-STEP PROGRESSIVE DISCLOSURE */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-slate-900/95 border border-indigo-500/30 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Yeni Kaynak Kitap Ekle</h3>
                  <p className="text-xs text-slate-400 font-medium">Soru bankanızı veya fasikülünüzü adım adım kaydedin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setExamType('');
                  setSubject('');
                  setBookTitle('');
                  setPublisher('');
                  setShowSuggestions(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer text-xs font-bold"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-5">
              
              {/* ── ADIM 1: SINAV TÜRÜ VE DERS SEÇİMİ ── */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-xs font-extrabold text-indigo-400 flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Adım 1: Sınav Türü & Ders Seçimi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Sınav Türü *</label>
                    <select
                      value={examType}
                      onChange={(e) => handleExamTypeChange(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-inner"
                    >
                      <option value="">Sınav Türü Seçiniz...</option>
                      <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
                      <option value="AYT">AYT (Alan Yeterlilik Testi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Ders *</label>
                    <select
                      disabled={!examType}
                      value={subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold cursor-pointer shadow-inner ${
                        !examType ? 'opacity-40 cursor-not-allowed text-slate-500' : ''
                      }`}
                    >
                      <option value="">{!examType ? 'Önce Sınav Türü Seçiniz' : 'Ders Seçiniz...'}</option>
                      {examType && YKS_SUBJECTS[examType].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── ADIM 2: KİTAP ADI VE YAYINEVİ (Ders seçilince animasyonlu açılır) ── */}
              {subject && (
                <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-xs font-extrabold text-indigo-400 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                    <span>Adım 2: Kitap Adı & Yayınevi</span>
                  </div>

                  {/* Kitap Adı Input with Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Kitap Adı *</span>
                      <span className="text-[10px] text-indigo-400 font-medium">Canlı Otomatik Tamamlama</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ör: 3D AYT Matematik Soru Bankası"
                        value={bookTitle}
                        onFocus={() => setShowSuggestions(true)}
                        onChange={(e) => {
                          setBookTitle(e.target.value);
                          setShowSuggestions(true);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium shadow-inner"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                    </div>

                    {/* Auto-complete Dropdown Menu */}
                    {showSuggestions && bookTitle.trim().length >= 1 && (() => {
                      const normSub = subject.toLowerCase();
                      const query = bookTitle.toLowerCase().trim();
                      const matchedRecs = RECOMMENDED_BOOKS.filter(b => {
                        const bSub = b.subject.toLowerCase();
                        const bCat = b.category.toLowerCase();
                        const isSubMatch = bSub === normSub || bCat.includes(normSub) || normSub.includes(bSub);
                        const isQueryMatch = b.name.toLowerCase().includes(query) || 
                                             b.publisher.toLowerCase().includes(query) || 
                                             `${b.publisher} ${b.name}`.toLowerCase().includes(query);
                        return isSubMatch && isQueryMatch;
                      }).slice(0, 5);

                      if (matchedRecs.length === 0) return null;

                      return (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-indigo-500/40 rounded-2xl p-2 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in duration-200 max-h-56 overflow-y-auto">
                          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1">
                            <span>Arama Önerileri ({subject})</span>
                            <span className="text-indigo-400 font-mono">{matchedRecs.length} Öneri</span>
                          </div>
                          {matchedRecs.map((rec, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setBookTitle(rec.name);
                                setPublisher(rec.publisher);
                                setShowSuggestions(false); // <--- CLOSES DROPDOWN INSTANTLY!
                              }}
                              className="p-2.5 hover:bg-indigo-950/80 rounded-xl cursor-pointer transition-all border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                  <span className="text-indigo-400 font-extrabold">{rec.publisher}</span> - {rec.name}
                                </div>
                                {rec.reason && (
                                  <p className="text-[10px] text-slate-400 truncate max-w-sm">{rec.reason}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                                {rec.difficulty}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Yayınevi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Yayınevi / Yayın Adı</label>
                    <input
                      type="text"
                      placeholder="Ör: 3D Yayınları, Bilgi Sarmal, Karekök"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium shadow-inner"
                    />
                  </div>
                </div>
              )}

              {/* ── ADIM 3: KONU SEÇİMİ, NOTLAR VE KAYDET BUTONU (Kitap adı girilince animasyonlu açılır) ── */}
              {subject && bookTitle.trim() && (
                <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-xs font-extrabold text-indigo-400 flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                    <span>Adım 3: Çözülen Konular & Notlar</span>
                  </div>

                  {/* Initial Completed Topics Selector */}
                  {YKS_CURRICULUM_TOPICS[subject] && YKS_CURRICULUM_TOPICS[subject].length > 0 && (
                    <div className="space-y-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-indigo-300">
                          Şu Ana Kadar Çözülen Konular ({selectedInitialTopics.length} / {YKS_CURRICULUM_TOPICS[subject].length})
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInitialTopics([...YKS_CURRICULUM_TOPICS[subject]])}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 cursor-pointer transition-all"
                          >
                            Tümünü Seç
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedInitialTopics([])}
                            className="text-[11px] text-slate-400 hover:text-white font-bold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800 cursor-pointer transition-all"
                          >
                            Temizle
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                        {YKS_CURRICULUM_TOPICS[subject].map((topicName) => {
                          const isSel = selectedInitialTopics.includes(topicName);
                          return (
                            <button
                              key={topicName}
                              type="button"
                              onClick={() => handleToggleInitialTopic(topicName)}
                              className={`flex items-center space-x-2 p-2 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                                isSel
                                  ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                              }`}
                            >
                              {isSel ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600 shrink-0" />
                              )}
                              <span className="truncate font-medium">{topicName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Notlar / Hızlı Değerlendirme (Opsiyonel)</label>
                    <input
                      type="text"
                      placeholder="Ör: Türev ve İntegral testleri öncelikli çözülecek..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium shadow-inner"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setExamType('');
                        setSubject('');
                        setBookTitle('');
                        setPublisher('');
                        setShowSuggestions(false);
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer border border-indigo-400/30"
                    >
                      Kaydet & Başlat
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RESOURCE BOOK */}
      {editingResource && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingResource(null); }}
        >
          <div className="bg-slate-900/95 border border-indigo-500/30 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white rounded-2xl shadow-md">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Kitap Bilgilerini Düzenle</h3>
                  <p className="text-xs text-slate-400 font-medium">Kitap detaylarını ve çözülen konuları güncelleyin</p>
                </div>
              </div>
              <button
                onClick={() => setEditingResource(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleUpdateResourceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Sınav Türü</label>
                  <select
                    value={editExamType}
                    onChange={(e) => handleEditExamTypeChange(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Ders</label>
                  <select
                    value={editSubject}
                    onChange={(e) => handleEditSubjectChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    {YKS_SUBJECTS[editExamType].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Kitap Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Ör: 3D AYT Matematik Soru Bankası"
                  value={editBookTitle}
                  onChange={(e) => setEditBookTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Yayınevi</label>
                <input
                  type="text"
                  placeholder="Ör: 3D Yayınları, Bilgi Sarmal, Karekök"
                  value={editPublisher}
                  onChange={(e) => setEditPublisher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Completed Topics Selector in Edit Mode */}
              {YKS_CURRICULUM_TOPICS[editSubject] && YKS_CURRICULUM_TOPICS[editSubject].length > 0 && (
                <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-300">
                      Çözülen Konular ({editCompletedTopics.length} / {YKS_CURRICULUM_TOPICS[editSubject].length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditCompletedTopics([...YKS_CURRICULUM_TOPICS[editSubject]])}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20"
                    >
                      Tümünü Seç
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {YKS_CURRICULUM_TOPICS[editSubject].map((topicName) => {
                      const isSel = editCompletedTopics.includes(topicName);
                      return (
                        <button
                          key={topicName}
                          type="button"
                          onClick={() => handleToggleEditTopic(topicName)}
                          className={`flex items-center space-x-2 p-2.5 rounded-xl text-left text-xs transition-all border cursor-pointer ${
                            isSel
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                          }`}
                        >
                          {isSel ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate font-medium">{topicName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">Notlar / Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ör: Türev testleri çözülecek..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer border border-indigo-400/30"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal for Resource Deletion */}
      <ConfirmDeleteModal
        isOpen={!!deletingResource}
        title="Kaynak Kitabı Sil"
        itemName={deletingResource?.title}
        onConfirm={() => {
          if (deletingResource) {
            onDeleteResource(deletingResource.id);
            setDeletingResource(null);
          }
        }}
        onClose={() => setDeletingResource(null)}
      />

    </div>
  );
};
