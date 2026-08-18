import React from 'react';
import { Lock } from 'lucide-react';
import { AppGlobalState, UserAccount, YKSDataState, StudentProfile, ClassDefinition, InstitutionalMockExam, FieldType, ClassAICoachAdvice, DailyStudyTimeLog } from '../../types';
import { AuditLogsView } from '../AuditLogsView';
import { SystemManagementView } from '../SystemManagementView';
import { BulkExamImportView } from '../BulkExamImportView';
import { InstitutionalMocksView } from '../InstitutionalMocksView';
import { TeacherDashboardView } from '../TeacherDashboardView';
import { DashboardView } from '../DashboardView';
import SubjectProgressView from '../SubjectProgressView';
import { RoutinesView } from '../RoutinesView';
import { StudyPlannerView } from '../StudyPlannerView';
import { PomodoroView } from '../PomodoroView';
import { QuestionTrackerView } from '../QuestionTrackerView';
import { ResourceTrackerView } from '../ResourceTrackerView';
import { PastQuestionsView } from '../PastQuestionsView';
import { BranchExamView } from '../BranchExamView';
import { GeneralMockView } from '../GeneralMockView';
import { YouTubeTrackerView } from '../YouTubeTrackerView';
import { AICoachView } from '../AICoachView';
import { RecommendationsView } from '../RecommendationsView';
import { MessagesView } from '../MessagesView';
import { UndoItem } from './AppTypes';

interface AppTabRouterProps {
  activeTab: string;
  currentUser: UserAccount;
  previewStudentUser?: UserAccount | null;
  onPreviewStudent?: (student: UserAccount) => void;
  globalState: AppGlobalState;
  currentStudentData: YKSDataState;
  resourceTrackerTab: 'resources' | 'topics';
  resourceTrackerDers: string;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  theme: 'light' | 'dark';
  undoStack: UndoItem[];
  handleUndo: () => void;
  clearAllAuditLogsInFirestore: () => void;
  setGlobalState: React.Dispatch<React.SetStateAction<AppGlobalState>>;
  handleSendMessage: (receiverId: string, content: string, attachmentUrl?: string, replyTo?: any) => void;
  handleSaveInstitutionalExams: (newExams: InstitutionalMockExam[]) => void;
  handleUpdateInstitutionalExam: (updatedExam: InstitutionalMockExam) => void;
  handleDeleteInstitutionalExam: (examIdOrIds: string | string[]) => void;
  handleDeleteAllInstitutionalExams: () => void;
  addAuditAndUndo: (description: string, category: any, actionType: string, undoFn?: () => void, targetUserId?: string, targetUserName?: string, metadata?: any) => void;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpdateStudentProfileByTeacher: (studentId: string, updatedProfile: StudentProfile) => void;
  handleUpdateStudentStudyPlansByTeacher: (studentId: string, updatedPlans: any[]) => void;
  handleUpdateStudentTopicErrorsByTeacher?: (studentId: string, updatedErrors: any[], actionText?: string) => void;
  handleCreateClass: (className: string, field: FieldType, description?: string) => void;
  handleAssignStudentClass: (studentId: string, newClassName: string) => void;
  handleSaveProgramTemplate: (templateData: any) => void;
  handleUpdateProgramTemplate: (updatedTemplate: any) => void;
  handleDeleteProgramTemplate: (templateId: string) => void;
  handleApplyTemplateToStudent: (studentId: string, templateId: string, mode: 'overwrite' | 'merge') => void;
  handleUpdateTeacherAssignedClasses: (teacherId: string, assignedClassNames: string[]) => void;
  handleUpdateTeacherAccount: (updatedTeacher: UserAccount) => void;
  handleDeleteClassDefinition: (classId: string) => void;
  handleUpdateClassDefinition: (updatedClass: ClassDefinition) => void;
  handleCreateTeacherUser: (newTeacher: Omit<UserAccount, 'id'>) => void;
  handleDeleteTeacherUser: (teacherId: string) => void;
  handleCreateStudentUser: (newStudent: Omit<UserAccount, 'id'>) => void;
  handleUpdateStudentAccount: (updatedStudent: UserAccount) => void;
  handleDeleteStudentUser: (studentId: string) => void;
  handleApproveStudent: (studentId: string) => void;
  handleRejectStudent: (studentId: string) => void;
  handleUpdateStudentSubjectNotesByTeacher: (studentId: string, subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
  handleUnlockUserAccount?: (userId: string) => void;
  setActiveTab: (tab: any) => void;
  setShowProfileModal: (show: boolean) => void;
  handleUpdateRoutines: (updatedRoutines: any[], actionText?: string) => void;
  handleUpdateStudentProfile: (updatedStudentProfile: StudentProfile) => void;
  handleUpdateSubjectNotes: (subjectName: string, notes: { studentNote?: string; teacherNote?: string }) => void;
  handleUpdateDashboardWidgets: (widgets: any[]) => void;
  handleUpdateQuickNotes: (updatedNotes: any[], actionText?: string) => void;
  handleUpdateTopicStatus: (topicName: string, status: any, isManual?: boolean) => void;
  handleNavigateTab: (tab: string, opts?: { subTab?: 'resources' | 'topics'; subject?: string }) => void;
  handleAddPlan: (plan: any) => void;
  handleUpdatePlan: (plan: any) => void;
  handleDeletePlan: (id: string) => void;
  handleAddQuestionLog: (log: any) => void;
  handleDeleteQuestionLog: (id: string) => void;
  handleUpdateAllPlans: (plans: any[], auditMessage?: string) => void;
  handleSaveDailyStudyLog?: (dateKey: string, log: DailyStudyTimeLog | null) => void;
  handleUpdateTaskTypes: (updatedTaskTypes: string[], actionText?: string) => void;
  handleUpdateQuestionLog: (updatedLog: any) => void;
  handleAddResource: (res: any) => void;
  handleUpdateResource: (res: any) => void;
  handleDeleteResource: (id: string) => void;
  handleUpdatePastExam: (pe: any) => void;
  handleToggleTopicCompleted: (topicKey: string) => void;
  handleAddBranchExam: (exam: any) => void;
  handleUpdateBranchExam: (updatedExam: any) => void;
  handleDeleteBranchExam: (id: string) => void;
  handleAddTopicError: (err: any) => void;
  handleUpdateTopicError: (err: any) => void;
  handleDeleteTopicError: (id: string) => void;
  handleUpdateTopicTipsCache: (cacheKey: string, data: any) => void;
  handleAddGeneralMock: (mock: any) => void;
  handleDeleteGeneralMock: (id: string) => void;
  handleUpdateGeneralMock: (updated: any) => void;
  handleAddYouTubeVideo: (vid: any) => void;
  handleUpdateYouTubeVideo: (vid: any) => void;
  handleDeleteYouTubeVideo: (id: string) => void;
  handleSaveAICoachAdvice: (advice: any) => void;
  handleDeleteAICoachAdvice: (idOrTimestamp: string) => void;
  handleSaveClassAICoachAdvice: (className: string, advice: ClassAICoachAdvice) => void;
  handleDeleteClassAICoachAdvice: (className: string, idOrTimestamp: string) => void;
  handleToggleFavoriteBook: (bookKey: string) => void;
  handleEditMessage: (messageId: string, newContent: string) => void;
  handleDeleteMessage: (messageId: string) => void;
  handleMarkAsRead: (messageIds: string[]) => void;
}

export const AppTabRouter: React.FC<AppTabRouterProps> = ({
  activeTab,
  currentUser,
  previewStudentUser = null,
  onPreviewStudent,
  globalState,
  currentStudentData,
  resourceTrackerTab,
  resourceTrackerDers,
  isZenMode,
  setIsZenMode,
  theme,
  undoStack,
  handleUndo,
  clearAllAuditLogsInFirestore,
  setGlobalState,
  handleSendMessage,
  handleSaveInstitutionalExams,
  handleUpdateInstitutionalExam,
  handleDeleteInstitutionalExam,
  handleDeleteAllInstitutionalExams,
  addAuditAndUndo,
  setIsMobileMenuOpen,
  handleUpdateStudentProfileByTeacher,
  handleUpdateStudentStudyPlansByTeacher,
  handleUpdateStudentTopicErrorsByTeacher,
  handleCreateClass,
  handleAssignStudentClass,
  handleSaveProgramTemplate,
  handleUpdateProgramTemplate,
  handleDeleteProgramTemplate,
  handleApplyTemplateToStudent,
  handleUpdateTeacherAssignedClasses,
  handleUpdateTeacherAccount,
  handleDeleteClassDefinition,
  handleUpdateClassDefinition,
  handleCreateTeacherUser,
  handleDeleteTeacherUser,
  handleCreateStudentUser,
  handleUpdateStudentAccount,
  handleDeleteStudentUser,
  handleApproveStudent,
  handleRejectStudent,
  handleUpdateStudentSubjectNotesByTeacher,
  setActiveTab,
  setShowProfileModal,
  handleUpdateRoutines,
  handleUpdateStudentProfile,
  handleUpdateSubjectNotes,
  handleUpdateDashboardWidgets,
  handleUpdateQuickNotes,
  handleUpdateTopicStatus,
  handleNavigateTab,
  handleAddPlan,
  handleUpdatePlan,
  handleDeletePlan,
  handleAddQuestionLog,
  handleDeleteQuestionLog,
  handleUpdateAllPlans,
  handleSaveDailyStudyLog,
  handleUpdateTaskTypes,
  handleUpdateQuestionLog,
  handleAddResource,
  handleUpdateResource,
  handleDeleteResource,
  handleUpdatePastExam,
  handleToggleTopicCompleted,
  handleAddBranchExam,
  handleUpdateBranchExam,
  handleDeleteBranchExam,
  handleAddTopicError,
  handleUpdateTopicError,
  handleDeleteTopicError,
  handleUpdateTopicTipsCache,
  handleAddGeneralMock,
  handleDeleteGeneralMock,
  handleUpdateGeneralMock,
  handleAddYouTubeVideo,
  handleUpdateYouTubeVideo,
  handleDeleteYouTubeVideo,
  handleSaveAICoachAdvice,
  handleDeleteAICoachAdvice,
  handleSaveClassAICoachAdvice,
  handleDeleteClassAICoachAdvice,
  handleToggleFavoriteBook,
  handleEditMessage,
  handleDeleteMessage,
  handleMarkAsRead,
  handleUnlockUserAccount
}) => {
  return (
    <>
      {/* AUDIT LOGS / AYAK İZİ VIEW */}
      {activeTab === 'audit_logs' && currentUser.role !== 'student' && (
        <AuditLogsView
          currentUser={currentUser}
          auditLogs={globalState.auditLogs || []}
          classes={globalState.classes}
          studentsData={globalState.studentsData}
          allUsers={globalState.users}
          onUndoLastAction={handleUndo}
          canUndo={undoStack.length > 0}
          lastUndoDescription={undoStack[undoStack.length - 1]?.description || ''}
          onClearLogs={() => {
            clearAllAuditLogsInFirestore();
            setGlobalState(prev => ({ ...prev, auditLogs: [] }));
          }}
        />
      )}

      {/* SYSTEM MANAGEMENT / SİSTEM YÖNETİMİ & MALİYET ANALİZİ VIEW */}
      {activeTab === 'teacher_system' && currentUser.role === 'admin' && (
        <SystemManagementView 
          auditLogs={globalState.auditLogs || []} 
          currentUser={currentUser}
          users={globalState.users}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* BULK EXAM IMPORT VIEW */}
      {activeTab === 'bulk_exam_import' && currentUser.role === 'admin' && (
        <BulkExamImportView
          currentUser={currentUser}
          users={globalState.users}
          classes={globalState.classes}
          studentsData={globalState.studentsData}
          institutionalMockExams={globalState.institutionalMockExams || []}
          onSaveInstitutionalExams={handleSaveInstitutionalExams}
          onUpdateInstitutionalExam={handleUpdateInstitutionalExam}
          onDeleteInstitutionalExam={handleDeleteInstitutionalExam}
          onDeleteAllInstitutionalExams={handleDeleteAllInstitutionalExams}
          onAddAuditLog={addAuditAndUndo}
          onToggleMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />
      )}

      {/* INSTITUTIONAL MOCKS VIEW (KARNELER & RAPORLAR) */}
      {activeTab === 'institutional_mocks' && (currentUser.role === 'school_counselor' || currentUser.role === 'admin') && (
        <InstitutionalMocksView
          currentUser={currentUser}
          users={globalState.users}
          classes={globalState.classes}
          studentsData={globalState.studentsData}
          institutionalMockExams={globalState.institutionalMockExams || []}
          onUpdateInstitutionalExam={handleUpdateInstitutionalExam}
          onDeleteInstitutionalExam={handleDeleteInstitutionalExam}
          onDeleteAllInstitutionalExams={handleDeleteAllInstitutionalExams}
          onToggleMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />
      )}

      {/* TEACHER DASHBOARD */}
      {(activeTab === 'teacher_summary' || activeTab === 'teacher_students' || activeTab === 'teacher_teachers' || activeTab === 'teacher_templates') && (currentUser.role === 'class_teacher' || currentUser.role === 'school_counselor' || currentUser.role === 'teacher' || currentUser.role === 'admin') && (
        <TeacherDashboardView
          teacher={currentUser}
          classes={globalState.classes}
          allUsers={globalState.users}
          studentsData={globalState.studentsData}
          programTemplates={globalState.programTemplates || []}
          auditLogs={globalState.auditLogs || []}
          activeTeacherSubView={activeTab === 'teacher_summary' ? 'summary' : activeTab === 'teacher_teachers' ? 'teachers' : activeTab === 'teacher_templates' ? 'templates' : 'students'}
          onUpdateStudentProfile={handleUpdateStudentProfileByTeacher}
          onUpdateStudentStudyPlans={handleUpdateStudentStudyPlansByTeacher}
          onUpdateStudentTopicErrors={handleUpdateStudentTopicErrorsByTeacher}
          onCreateClass={handleCreateClass}
          onAssignStudentClass={handleAssignStudentClass}
          onSaveProgramTemplate={handleSaveProgramTemplate}
          onUpdateProgramTemplate={handleUpdateProgramTemplate}
          onDeleteProgramTemplate={handleDeleteProgramTemplate}
          onApplyTemplateToStudent={handleApplyTemplateToStudent}
          onUpdateTeacherAssignedClasses={handleUpdateTeacherAssignedClasses}
          onUpdateTeacherAccount={handleUpdateTeacherAccount}
          onDeleteClass={handleDeleteClassDefinition}
          onUpdateClass={handleUpdateClassDefinition}
          onCreateTeacherAccount={handleCreateTeacherUser}
          onDeleteTeacherAccount={handleDeleteTeacherUser}
          onCreateStudentAccount={handleCreateStudentUser}
          onUpdateStudentAccount={handleUpdateStudentAccount}
          onDeleteStudentAccount={handleDeleteStudentUser}
          onApproveStudent={handleApproveStudent}
          onRejectStudent={handleRejectStudent}
          onUpdateStudentSubjectNotes={handleUpdateStudentSubjectNotesByTeacher}
          onUnlockUserAccount={handleUnlockUserAccount}
          onPreviewStudent={onPreviewStudent}
        />
      )}

      {/* STUDENT DASHBOARD */}
      {activeTab === 'dashboard' && (
        <DashboardView
          state={currentStudentData}
          currentUser={previewStudentUser || currentUser}
          onNavigateTab={setActiveTab}
          onOpenProfile={() => setShowProfileModal(true)}
          onUpdateRoutines={handleUpdateRoutines}
          onUpdateStudentProfile={handleUpdateStudentProfile}
          onUpdateSubjectNotes={handleUpdateSubjectNotes}
          onUpdateDashboardWidgets={handleUpdateDashboardWidgets}
          onUpdateQuickNotes={handleUpdateQuickNotes}
        />
      )}

      {activeTab === 'subject_progress' && (
        <SubjectProgressView
          state={currentStudentData}
          onUpdateTopicStatus={handleUpdateTopicStatus}
          onNavigateTab={handleNavigateTab}
        />
      )}

      {activeTab === 'routines' && (
        <RoutinesView
          state={currentStudentData}
          onUpdateRoutines={handleUpdateRoutines}
        />
      )}

      {activeTab === 'planner' && (
        <StudyPlannerView
          studyPlans={currentStudentData.studyPlans}
          questionLogs={currentStudentData.questionLogs}
          onAddPlan={handleAddPlan}
          onUpdatePlan={handleUpdatePlan}
          onDeletePlan={handleDeletePlan}
          onAddQuestionLog={handleAddQuestionLog}
          onDeleteQuestionLog={handleDeleteQuestionLog}
          onUpdateAllPlans={handleUpdateAllPlans}
          taskTypes={currentStudentData.taskTypes}
          onUpdateTaskTypes={handleUpdateTaskTypes}
          isZenMode={isZenMode}
          onZenModeChange={setIsZenMode}
          profile={currentStudentData.profile}
          topicErrors={currentStudentData.topicErrors}
          generalMocks={currentStudentData.generalMocks}
          branchExams={currentStudentData.branchExams}
          youtubeVideos={currentStudentData.youtubeVideos || []}
          topicStatuses={currentStudentData.topicStatuses}
          completedPastTopics={currentStudentData.completedPastTopics}
          dailyStudyLogs={currentStudentData.dailyStudyLogs || {}}
          onSaveDailyStudyLog={handleSaveDailyStudyLog}
        />
      )}

      {activeTab === 'pomodoro' && (
        <PomodoroView
          studyPlans={currentStudentData.studyPlans}
          routines={currentStudentData.routines || []}
          onUpdatePlan={handleUpdatePlan}
          onZenModeChange={setIsZenMode}
        />
      )}

      {activeTab === 'questions' && (
        <QuestionTrackerView
          questionLogs={currentStudentData.questionLogs}
          targetField={currentStudentData.profile?.targetField}
          onAddLog={handleAddQuestionLog}
          onUpdateLog={handleUpdateQuestionLog}
          onDeleteLog={handleDeleteQuestionLog}
          theme={theme}
        />
      )}

      {activeTab === 'resources' && (
        <ResourceTrackerView
          resources={currentStudentData.resources}
          pastExams={currentStudentData.pastExams}
          targetField={currentStudentData.profile?.targetField}
          onAddResource={handleAddResource}
          onUpdateResource={handleUpdateResource}
          onDeleteResource={handleDeleteResource}
          onUpdatePastExam={handleUpdatePastExam}
          topicStatuses={currentStudentData.topicStatuses || {}}
          onUpdateTopicStatus={handleUpdateTopicStatus}
          manuallyChangedTopicStatuses={currentStudentData.manuallyChangedTopicStatuses || []}
          initialTrackerTab={resourceTrackerTab}
          initialDersFilter={resourceTrackerDers}
        />
      )}

      {activeTab === 'past_questions' && (
        <PastQuestionsView
          completedPastTopics={currentStudentData.completedPastTopics}
          onTogglePastTopic={handleToggleTopicCompleted}
        />
      )}

      {activeTab === 'errors' && (
        <BranchExamView
          currentUser={currentUser || undefined}
          previewStudentUser={previewStudentUser}
          mode="errors"
          branchExams={currentStudentData.branchExams}
          topicErrors={currentStudentData.topicErrors}
          generalMocks={currentStudentData.generalMocks}
          resources={currentStudentData.resources}
          topicTipsCache={currentStudentData.topicTipsCache}
          onAddBranchExam={handleAddBranchExam}
          onUpdateBranchExam={handleUpdateBranchExam}
          onDeleteBranchExam={handleDeleteBranchExam}
          onAddTopicError={handleAddTopicError}
          onUpdateTopicError={handleUpdateTopicError}
          onDeleteTopicError={handleDeleteTopicError}
          onUpdateTopicTipsCache={handleUpdateTopicTipsCache}
          theme={theme}
          onAddAuditLog={addAuditAndUndo}
        />
      )}

      {activeTab === 'branches' && (
        <BranchExamView
          currentUser={currentUser || undefined}
          previewStudentUser={previewStudentUser}
          mode="branches"
          branchExams={currentStudentData.branchExams}
          topicErrors={currentStudentData.topicErrors}
          generalMocks={currentStudentData.generalMocks}
          resources={currentStudentData.resources}
          topicTipsCache={currentStudentData.topicTipsCache}
          onAddBranchExam={handleAddBranchExam}
          onUpdateBranchExam={handleUpdateBranchExam}
          onDeleteBranchExam={handleDeleteBranchExam}
          onAddTopicError={handleAddTopicError}
          onUpdateTopicError={handleUpdateTopicError}
          onDeleteTopicError={handleDeleteTopicError}
          onUpdateTopicTipsCache={handleUpdateTopicTipsCache}
          theme={theme}
          onAddAuditLog={addAuditAndUndo}
        />
      )}

      {activeTab === 'mocks' && (
        <GeneralMockView
          generalMocks={currentStudentData.generalMocks}
          profile={currentStudentData.profile}
          institutionalMocks={currentStudentData.institutionalMocks || []}
          onAddMock={handleAddGeneralMock}
          onDeleteMock={handleDeleteGeneralMock}
          onUpdateMock={handleUpdateGeneralMock}
          onUpdateProfile={handleUpdateStudentProfile}
        />
      )}

      {activeTab === 'youtube' && (
        <YouTubeTrackerView
          videos={currentStudentData.youtubeVideos}
          onAddVideo={handleAddYouTubeVideo}
          onUpdateVideo={handleUpdateYouTubeVideo}
          onDeleteVideo={handleDeleteYouTubeVideo}
        />
      )}

      {activeTab === 'ai_coach' && (
        <AICoachView
          state={currentStudentData}
          onSaveAdvice={handleSaveAICoachAdvice}
          onDeleteAdvice={handleDeleteAICoachAdvice}
          onSaveClassAdvice={handleSaveClassAICoachAdvice}
          onDeleteClassAdvice={handleDeleteClassAICoachAdvice}
          currentUser={currentUser}
          previewStudentUser={previewStudentUser}
          allUsers={globalState.users}
          classes={globalState.classes}
          studentsData={globalState.studentsData}
          onAddAuditLog={addAuditAndUndo}
        />
      )}

      {activeTab === 'recommendations' && (
        <RecommendationsView
          onAddVideo={handleAddYouTubeVideo}
          onAddResource={handleAddResource}
          onDeleteVideo={handleDeleteYouTubeVideo}
          onDeleteResource={handleDeleteResource}
          trackedVideos={currentStudentData.youtubeVideos || []}
          trackedResources={currentStudentData.resources || []}
          favoriteBooks={currentStudentData.favoriteBooks || []}
          onToggleFavoriteBook={handleToggleFavoriteBook}
          currentUser={currentUser}
          customRecommendations={globalState.customRecommendations || { channels: [], books: [] }}
          onAddAuditLog={addAuditAndUndo}
        />
      )}

      {activeTab === 'messages' && (
        previewStudentUser ? (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Özel Mesajlaşma Gizlidir</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Öğrenci gözünden önizleme modunda öğrencinin özel mesajları ve kişisel sohbet geçmişi gizlilik ve KVKK ilkeleri gereğince görüntülenemez.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 border border-indigo-400/40 cursor-pointer"
            >
              Öğrenci Genel Özetine Dön
            </button>
          </div>
        ) : (
          <MessagesView
            currentUser={currentUser}
            allUsers={globalState.users}
            classes={globalState.classes}
            messages={globalState.messages || []}
            studentsData={globalState.studentsData}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onMarkAsRead={handleMarkAsRead}
          />
        )
      )}
    </>
  );
};
