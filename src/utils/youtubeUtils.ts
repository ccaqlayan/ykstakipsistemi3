import { StudyPlanItem } from '../types';

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
