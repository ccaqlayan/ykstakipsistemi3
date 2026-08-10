import React from 'react';
import { 
  BookMarked, 
  BookOpen, 
  BarChart2, 
  Clock, 
  Target, 
  Youtube, 
  ChevronRight 
} from 'lucide-react';
import { DetailSubTab } from './SubjectTypes';

interface SubjectDetailOverviewTabProps {
  activeDetailData: any;
  setDetailSubTab: (tab: DetailSubTab) => void;
  formatMinutes: (mins: number) => string;
}

export const SubjectDetailOverviewTab: React.FC<SubjectDetailOverviewTabProps> = ({
  activeDetailData,
  setDetailSubTab,
  formatMinutes,
}) => {
  return (
    <div className="space-y-6">
      {/* Clean Summary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Card 1: Konu Müfredatı Özet Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-400">
                <BookMarked className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Konu İlerlemesi</h3>
              </div>
              <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                %{activeDetailData.topicCompletionPercent}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Tamamlanan Konu</span>
                <span className="text-white font-mono">{activeDetailData.completedTopicsCount} / {activeDetailData.topics.length}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  style={{ width: `${activeDetailData.topicCompletionPercent}%` }} 
                  className={`h-full bg-gradient-to-r ${activeDetailData.category.gradient} rounded-full`} 
                />
              </div>
            </div>

            {/* Mini Status Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">Uzmanlaştım:</span>
                <span className="font-black text-white font-mono">{activeDetailData.masteredCount}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-indigo-300 font-semibold">Çalıştım:</span>
                <span className="font-black text-white font-mono">{activeDetailData.workedCount}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-rose-400 font-semibold">Zor Geldi:</span>
                <span className="font-black text-white font-mono">{activeDetailData.hardCount}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                <span className="text-amber-400 font-semibold">Erteledim:</span>
                <span className="font-black text-white font-mono">{activeDetailData.postponedCount}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDetailSubTab('topics')}
            className="w-full mt-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Konu Listesini İncele</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Kaynaklar & Kitap Özet Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Kaynak & Kitaplar</h3>
              </div>
              <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                {activeDetailData.matchedResources.length} Kitap
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                <span>Çözülen Test Oranı</span>
                <span className="text-white font-mono">%{activeDetailData.resourcePercent}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  style={{ width: `${activeDetailData.resourcePercent}%` }} 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" 
                />
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Takipteki Kitaplar</div>
              {activeDetailData.matchedResources.length > 0 ? (
                <div className="space-y-1">
                  {activeDetailData.matchedResources.slice(0, 2).map((r: any) => (
                    <div key={r.id} className="text-xs flex items-center justify-between">
                      <span className="text-white font-medium truncate max-w-[180px]">{r.bookTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.completedUnits}/{r.totalUnits} Test</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Henüz kaynak eklenmedi.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setDetailSubTab('resources')}
            className="w-full mt-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Kaynak Detaylarını Gör</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Soru Çözüm Analizi Özet Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <BarChart2 className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Soru Analizi</h3>
              </div>
              <span className="text-xs font-black text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                %{activeDetailData.questionAccuracy} Doğruluk
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Çözülen</div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {activeDetailData.totalSolvedQuestions.toLocaleString('tr-TR')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <div className="text-[9.5px] text-emerald-400 font-bold uppercase">Doğru</div>
                <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalCorrectQuestions}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <div className="text-[9.5px] text-rose-400 font-bold uppercase">Yanlış</div>
                <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalWrongQuestions}</div>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <div className="text-[9.5px] text-amber-400 font-bold uppercase">Boş</div>
                <div className="font-mono font-bold text-white mt-0.5">{activeDetailData.totalEmptyQuestions}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDetailSubTab('questions')}
            className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Soru Takip Kayıtlarını Aç</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 4: Çalışma Süreleri Özet Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Çalışma Süresi</h3>
              </div>
              <span className="text-xs font-black text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                {activeDetailData.matchedPlans.length} Oturum
              </span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Çalışılan Süre</div>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
                {formatMinutes(activeDetailData.totalStudyMinutes)}
              </div>
              <div className="text-[10.5px] text-slate-400 font-semibold mt-1">
                ({formatMinutes(Math.round(activeDetailData.totalStudyMinutes / activeDetailData.activeDaysCount))}/gün)
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
              Haftalık programa eklenmiş ve tamamlanmış çalışma zamanlarının özeti.
            </p>
          </div>

          <button
            onClick={() => setDetailSubTab('study')}
            className="w-full mt-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Çalışma Oturumlarını İncele</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 5: Deneme Sınavları Özet Kartı (Branş & Genel) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <Target className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Deneme Sınavları</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-black text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {activeDetailData.branchExamCount} Branş
                </span>
                <span className="text-[10px] font-black text-indigo-300 font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {activeDetailData.generalExamCount} Genel
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Branş Ort. Net</div>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                  {activeDetailData.avgBranchNet} Net
                </div>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Genel Deneme</div>
                <div className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                  {activeDetailData.generalExamCount} Sınav
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
              Branş ve genel deneme sınavlarında bu derse ait net ve soru dökümü takibi.
            </p>
          </div>

          <button
            onClick={() => setDetailSubTab('mocks')}
            className="w-full mt-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Deneme Sonuçlarını Gör</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 6: YouTube & Hata Defteri Özet Kartı */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-rose-500/40 transition-all flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400">
                <Youtube className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Video & Hatalar</h3>
              </div>
              <span className="text-xs font-black text-rose-300 font-mono bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                {activeDetailData.totalVideos} Video
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                <div className="text-[10px] text-slate-400 font-bold uppercase">İzlenen Video</div>
                <div className="text-lg font-black text-rose-400 font-mono mt-0.5">{activeDetailData.watchedVideos} / {activeDetailData.totalVideos}</div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Hata Kaydı</div>
                <div className="text-lg font-black text-purple-400 font-mono mt-0.5">{activeDetailData.totalErrors} Kayıt</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
              Konu anlatım videoları ve tekrar edilmesi gereken soru hataları.
            </p>
          </div>

          <button
            onClick={() => setDetailSubTab('youtube')}
            className="w-full mt-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>Video & Hata Defterini Aç</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
