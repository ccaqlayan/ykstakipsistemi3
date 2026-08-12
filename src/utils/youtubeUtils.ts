import { StudyPlanItem, YouTubeVideoItem } from '../types';

export const extractYouTubeVideoId = (text?: string): string | null => {
  if (!text) return null;
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|playlist\?list=.*[&?]v=))([\w-]{11})/);
  if (match && match[1]) return match[1];
  const matchV = text.match(/[?&]v=([\w-]{11})/);
  if (matchV && matchV[1]) return matchV[1];
  return null;
};

export const getYouTubeUrlFromPlan = (plan: StudyPlanItem): string | null => {
  if (plan.notes) {
    const urlMatch = plan.notes.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) return urlMatch[1];
  }
  const idFromNotes = extractYouTubeVideoId(plan.notes);
  if (idFromNotes) return `https://www.youtube.com/watch?v=${idFromNotes}`;
  
  const idFromTopic = extractYouTubeVideoId(plan.topic);
  if (idFromTopic) return `https://www.youtube.com/watch?v=${idFromTopic}`;

  return null;
};

export const getYouTubeThumbnailFromPlan = (plan: StudyPlanItem): string | null => {
  const id = extractYouTubeVideoId(plan.notes) || extractYouTubeVideoId(plan.topic);
  if (id) return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  return null;
};

export const isVideoTask = (plan: StudyPlanItem): boolean => {
  if (getYouTubeThumbnailFromPlan(plan) || getYouTubeUrlFromPlan(plan)) return true;
  if (plan.taskType && (plan.taskType.toLowerCase().includes('video') || plan.taskType.toLowerCase().includes('youtube'))) return true;
  if (plan.topic && plan.topic.startsWith('[Video]')) return true;
  return false;
};

export const formatDurationBadge = (minutes?: number): string | null => {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
  }
  return `${mins} dk`;
};

export const shouldShowPlanNote = (plan: StudyPlanItem): boolean => {
  if (!plan.notes) return false;
  if (isVideoTask(plan)) {
    const trimmed = plan.notes.trim();
    if (extractYouTubeVideoId(trimmed) || /^https?:\/\//i.test(trimmed)) {
      return false;
    }
  }
  return true;
};

export const syncCompletedPlanToYoutubeVideos = (
  completedPlan: StudyPlanItem,
  youtubeVideos: YouTubeVideoItem[]
): YouTubeVideoItem[] => {
  if (completedPlan.status !== 'completed') return youtubeVideos;

  const planYtId = extractYouTubeVideoId(completedPlan.notes) || extractYouTubeVideoId(completedPlan.topic);
  const planNotesUrl = completedPlan.notes ? (completedPlan.notes.match(/(https?:\/\/[^\s]+)/)?.[1] || '') : '';
  const planTopicClean = completedPlan.topic.replace(/^\[Video\]\s*/i, '').trim().toLowerCase();

  let hasChanges = false;

  const updatedVideos = youtubeVideos.map(vid => {
    let videoChanged = false;
    let newIsWatched = vid.isWatched;
    let newPlaylistVideos = vid.playlistVideos;

    const mainYtId = extractYouTubeVideoId(vid.videoUrl);

    // 1. Direct single video match
    if (!vid.isPlaylist) {
      const matchById = Boolean(planYtId && mainYtId && planYtId === mainYtId);
      const matchByUrl = Boolean(planNotesUrl && vid.videoUrl && (planNotesUrl.includes(vid.videoUrl) || vid.videoUrl.includes(planNotesUrl)));
      const matchByTopic = Boolean(planTopicClean && vid.topicName && (planTopicClean.includes(vid.topicName.toLowerCase()) || vid.topicName.toLowerCase().includes(planTopicClean)));

      if ((matchById || matchByUrl || matchByTopic) && !vid.isWatched) {
        newIsWatched = true;
        videoChanged = true;
      }
    } else if (vid.playlistVideos && vid.playlistVideos.length > 0) {
      // 2. Playlist sub-videos match
      newPlaylistVideos = vid.playlistVideos.map(sub => {
        const subYtId = extractYouTubeVideoId(sub.videoUrl);
        const matchSubId = Boolean(planYtId && subYtId && planYtId === subYtId);
        const matchSubUrl = Boolean(planNotesUrl && sub.videoUrl && (planNotesUrl.includes(sub.videoUrl) || sub.videoUrl.includes(planNotesUrl)));
        const matchSubTitle = Boolean(planTopicClean && sub.title && (planTopicClean.includes(sub.title.toLowerCase()) || sub.title.toLowerCase().includes(planTopicClean)));

        if ((matchSubId || matchSubUrl || matchSubTitle) && !sub.isWatched) {
          videoChanged = true;
          return { ...sub, isWatched: true };
        }
        return sub;
      });

      // Check if all playlist sub-videos are now watched
      const allWatched = newPlaylistVideos.every(s => s.isWatched);
      if (allWatched && !newIsWatched) {
        newIsWatched = true;
        videoChanged = true;
      }
    }

    if (videoChanged) {
      hasChanges = true;
      return {
        ...vid,
        isWatched: newIsWatched,
        playlistVideos: newPlaylistVideos
      };
    }

    return vid;
  });

  return hasChanges ? updatedVideos : youtubeVideos;
};
