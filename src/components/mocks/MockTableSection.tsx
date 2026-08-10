import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Pencil, Clock, SlidersHorizontal, ChevronDown, Calculator, Trash2 } from 'lucide-react';
import { GeneralMockExam, InstitutionalMockExam } from '../../types';

interface MockTableSectionProps {
  mockListTab: 'individual' | 'institutional';
  setMockListTab: (tab: 'individual' | 'institutional') => void;
  generalMocks: GeneralMockExam[];
  institutionalMocks: InstitutionalMockExam[];
  sortOrder: 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  sortedGeneralMocks: GeneralMockExam[];
  setSelectedInstitutionalExam: (exam: InstitutionalMockExam | null) => void;
  handleStartEdit: (mock: GeneralMockExam) => void;
  onUpdateMock: (mock: GeneralMockExam) => void;
  expandedMockDetails: Record<string, boolean>;
  toggleExpandMockDetails: (id: string) => void;
  setCalcMock: (mock: GeneralMockExam | null) => void;
  setShowAllFields: (show: boolean) => void;
  setDeletingMock: (mock: { id: string; title: string } | null) => void;
}

export const MockTableSection: React.FC<MockTableSectionProps> = ({
  mockListTab,
  setMockListTab,
  generalMocks,
  institutionalMocks,
  sortOrder,
  setSortOrder,
  sortedGeneralMocks,
  setSelectedInstitutionalExam,
  handleStartEdit,
  onUpdateMock,
  expandedMockDetails,
  toggleExpandMockDetails,
  setCalcMock,
  setShowAllFields,
  setDeletingMock
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800"
        >
          <span>Sıralama:</span>
          <span className="text-indigo-400">
            {sortOrder === 'desc' ? 'Yeni' : 'Eski'}
          </span>
          {sortOrder === 'desc' ? (
            <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </button>

        {mockListTab === 'individual' && generalMocks.length > 0 && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{generalMocks.filter(m => m.isAnalyzed).length} / {generalMocks.length} Analiz Edildi</span>
          </div>
        )}
      </div>

      {mockListTab === 'institutional' ? (
        (() => {
          const sortedInstitutionalMocks = [...institutionalMocks].sort((a, b) => {
            const dateA = new Date(a.examDate).getTime() || 0;
            const dateB = new Date(b.examDate).getTime() || 0;
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });

          return sortedInstitutionalMocks.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">Okul tarafından yüklenmiş kurumsal deneme karneniz bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedInstitutionalMocks.map((exam) => {
                const displayScores = [];
                if (exam.scores.sayScore !== undefined) {
                  displayScores.push({ label: 'SAY', score: exam.scores.sayScore, rank: exam.scores.sayClassRank, total: exam.scores.sayClassTotal });
                }
                if (exam.scores.eaScore !== undefined) {
                  displayScores.push({ label: 'EA', score: exam.scores.eaScore, rank: exam.scores.eaClassRank, total: exam.scores.eaClassTotal });
                }
                if (exam.scores.sozScore !== undefined) {
                  displayScores.push({ label: 'SÖZ', score: exam.scores.sozScore, rank: exam.scores.sozClassRank, total: exam.scores.sozClassTotal });
                }

                return (
                  <div
                    key={exam.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 animate-fade-in relative group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {exam.examDate}
                        </span>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                          {exam.examType || 'Kurumsal'}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-white mt-3 line-clamp-2 font-bold">
                        {exam.examTitle}
                      </h3>

                      {exam.scores.classParticipantCount && (
                        <p className="text-[11px] text-slate-400 font-semibold mt-1.5 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Katılımcı Sayısı: {exam.scores.classParticipantCount} Öğrenci</span>
                        </p>
                      )}

                      {displayScores.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          {displayScores.map((sc, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800/60 rounded-xl p-2.5 text-center">
                              <span className="text-[10px] text-slate-400 font-bold block">{sc.label} Puanı</span>
                              <strong className="text-indigo-300 text-sm font-mono block mt-0.5">{sc.score}</strong>
                              {sc.rank && (
                                <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">Sıra: {sc.rank} / {sc.total || '-'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {exam.studentName} {exam.schoolNumber ? `(#${exam.schoolNumber})` : ''}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedInstitutionalExam(exam)}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Karnemi Görüntüle</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      ) : sortedGeneralMocks.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <p className="text-xs text-slate-400">Henüz genel deneme kaydı bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedGeneralMocks.map((mock) => (
            <div
              key={mock.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {mock.date}
                  </span>
                  <h3 
                    onClick={() => handleStartEdit(mock)}
                    className="text-sm font-bold text-white cursor-pointer hover:text-indigo-400 flex items-center gap-1.5 transition-colors group/mock-title"
                    title="Düzenlemek için tıklayın"
                  >
                    <span>{mock.title}</span>
                    <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover/mock-title:opacity-100 transition-opacity" />
                  </h3>

                  <button
                    type="button"
                    onClick={() => onUpdateMock({ ...mock, isAnalyzed: !mock.isAnalyzed })}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1 cursor-pointer border ${
                      mock.isAnalyzed
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                    title="Soru ve hata analiz durumunu değiştirmek için tıklayın"
                  >
                    {mock.isAnalyzed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Analiz Edildi</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Analiz Bekliyor</span>
                      </>
                    )}
                  </button>
                </div>

                {mock.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">{mock.notes}</p>
                )}

                {/* TYT & AYT Breakdown */}
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 mt-2 font-mono">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="text-indigo-400 font-bold mr-1">TYT</span>
                    TÜR: <strong>{String(mock.tyt.turkce).replace('.', ',')}</strong> | MAT: <strong>{String(mock.tyt.mat).replace('.', ',')}</strong> | SOS: <strong>{String(mock.tyt.sosyal).replace('.', ',')}</strong> | FEN: <strong>{String(mock.tyt.fen).replace('.', ',')}</strong>
                  </span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold mr-1">AYT</span>
                    MAT: <strong>{String(mock.ayt.mat).replace('.', ',')}</strong> | FEN: <strong>{String(mock.ayt.fen).replace('.', ',')}</strong>
                    {mock.ayt.edebiyatSos1 !== undefined && mock.ayt.edebiyatSos1 > 0 && (
                      <> | EDB-SOS1: <strong>{String(mock.ayt.edebiyatSos1).replace('.', ',')}</strong></>
                    )}
                    {mock.ayt.sos2 !== undefined && mock.ayt.sos2 > 0 && (
                      <> | SOS2: <strong>{String(mock.ayt.sos2).replace('.', ',')}</strong></>
                    )}
                  </span>
                </div>

                {/* Granular Sub-subject Breakdown Accordion Toggle */}
                {(mock.tyt.details || mock.ayt.details) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpandMockDetails(mock.id)}
                      className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                      <span>{expandedMockDetails[mock.id] ? 'Ayrıntılı Ders Detaylarını Gizle' : 'Ayrıntılı Ders Detaylarını Göster (Mat/Geo, Fiz/Kim/Biyo...)'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMockDetails[mock.id] ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedMockDetails[mock.id] && (
                      <div className="mt-2.5 p-3 bg-slate-900/90 border border-slate-800/80 rounded-xl space-y-3 text-[11px] font-mono animate-fade-in">
                        {/* TYT Sub-subjects */}
                        {mock.tyt.details && (
                          <div>
                            <div className="text-[11px] font-bold text-indigo-400 mb-1.5 flex items-center gap-1">
                              <span>TYT Alt Ders Netleri</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                              {mock.tyt.details.matematik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Matematik</span>
                                  <strong className="text-indigo-300 text-xs">{String(mock.tyt.details.matematik.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.matematik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.matematik.correct}D {mock.tyt.details.matematik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.geometri && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Geometri</span>
                                  <strong className="text-purple-300 text-xs">{String(mock.tyt.details.geometri.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.geometri.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.geometri.correct}D {mock.tyt.details.geometri.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.fizik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Fizik</span>
                                  <strong className="text-sky-300 text-xs">{String(mock.tyt.details.fizik.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.fizik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.fizik.correct}D {mock.tyt.details.fizik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.kimya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Kimya</span>
                                  <strong className="text-teal-300 text-xs">{String(mock.tyt.details.kimya.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.kimya.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.kimya.correct}D {mock.tyt.details.kimya.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.biyoloji && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Biyoloji</span>
                                  <strong className="text-emerald-300 text-xs">{String(mock.tyt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                  {mock.tyt.details.biyoloji.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.tyt.details.biyoloji.correct}D {mock.tyt.details.biyoloji.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.tyt.details.tarih && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Tarih</span>
                                  <strong className="text-amber-300 text-xs">{String(mock.tyt.details.tarih.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.cografya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Coğrafya</span>
                                  <strong className="text-orange-300 text-xs">{String(mock.tyt.details.cografya.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.felsefe && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Felsefe</span>
                                  <strong className="text-fuchsia-300 text-xs">{String(mock.tyt.details.felsefe.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.tyt.details.din && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Din Kültürü</span>
                                  <strong className="text-pink-300 text-xs">{String(mock.tyt.details.din.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* AYT Sub-subjects */}
                        {mock.ayt.details && (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
                              <span>AYT Alt Ders Netleri</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-300">
                              {mock.ayt.details.matematik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Matematik</span>
                                  <strong className="text-purple-300 text-xs">{String(mock.ayt.details.matematik.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.matematik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.matematik.correct}D {mock.ayt.details.matematik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.geometri && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Geometri</span>
                                  <strong className="text-fuchsia-300 text-xs">{String(mock.ayt.details.geometri.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.geometri.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.geometri.correct}D {mock.ayt.details.geometri.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.fizik && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Fizik</span>
                                  <strong className="text-sky-300 text-xs">{String(mock.ayt.details.fizik.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.fizik.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.fizik.correct}D {mock.ayt.details.fizik.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.kimya && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Kimya</span>
                                  <strong className="text-teal-300 text-xs">{String(mock.ayt.details.kimya.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.kimya.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.kimya.correct}D {mock.ayt.details.kimya.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.biyoloji && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">AYT Biyoloji</span>
                                  <strong className="text-emerald-300 text-xs">{String(mock.ayt.details.biyoloji.net).replace('.', ',')} Net</strong>
                                  {mock.ayt.details.biyoloji.correct !== undefined && (
                                    <span className="text-[10px] text-slate-500 block">({mock.ayt.details.biyoloji.correct}D {mock.ayt.details.biyoloji.wrong}Y)</span>
                                  )}
                                </div>
                              )}
                              {mock.ayt.details.edebiyat && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Edebiyat</span>
                                  <strong className="text-rose-300 text-xs">{String(mock.ayt.details.edebiyat.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.ayt.details.tarih1 && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Tarih-1</span>
                                  <strong className="text-amber-300 text-xs">{String(mock.ayt.details.tarih1.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                              {mock.ayt.details.cografya1 && (
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                                  <span className="text-slate-400 block text-[10px]">Coğrafya-1</span>
                                  <strong className="text-orange-300 text-xs">{String(mock.ayt.details.cografya1.net).replace('.', ',')} Net</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals & Delete & Calculate */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 w-full lg:w-auto">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-center px-2 sm:px-3">
                    <div className="text-[10px] text-slate-400">TYT Toplam</div>
                    <div className="text-base sm:text-lg font-bold text-indigo-400 font-mono">{String(mock.tyt.totalNet).replace('.', ',')}</div>
                  </div>

                  <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                    <div className="text-[10px] text-slate-400">AYT Toplam</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">{String(mock.ayt.totalNet).replace('.', ',')}</div>
                  </div>

                  {mock.estimatedRank && (
                    <div className="text-center px-2 sm:px-3 border-l border-slate-800">
                      <div className="text-[10px] text-slate-400">Tahmini Sıra</div>
                      <div className="text-xs sm:text-sm font-bold text-amber-400 font-mono">#{mock.estimatedRank}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setCalcMock(mock);
                      setShowAllFields(false);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 cursor-pointer shadow-sm"
                    title="YKS Puan & Sıralama Hesapla"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Puan Hesapla</span>
                  </button>

                  <button
                    onClick={() => setDeletingMock({ id: mock.id, title: `${mock.date} - ${mock.title}` })}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Denemeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
