import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export const learnKeys = {
  chapters: ['chapters'],
  chapter: (slug) => ['chapter', slug],
  topic: (c, t) => ['topic', c, t],
  summary: ['progress-summary'],
};

export const useChapters = () =>
  useQuery({ queryKey: learnKeys.chapters, queryFn: async () => (await api.get('/chapters')).data.chapters });

export const useChapter = (slug) =>
  useQuery({ queryKey: learnKeys.chapter(slug), queryFn: async () => (await api.get(`/chapters/${slug}`)).data });

export const useTopic = (chapterSlug, topicSlug) =>
  useQuery({
    queryKey: learnKeys.topic(chapterSlug, topicSlug),
    queryFn: async () => (await api.get(`/chapters/${chapterSlug}/topics/${topicSlug}`)).data,
    retry: (count, err) => ![402, 404].includes(err?.response?.status) && count < 1,
  });

export const useProgressSummary = () =>
  useQuery({ queryKey: learnKeys.summary, queryFn: async () => (await api.get('/progress/summary')).data });

/** Invalidate everything that shows progress after it changes. */
function useInvalidateProgress() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: learnKeys.chapters });
    qc.invalidateQueries({ queryKey: ['chapter'] });
    qc.invalidateQueries({ queryKey: learnKeys.summary });
  };
}

export function useCompleteTopic() {
  const setUser = useAuthStore((s) => s.setUser);
  const invalidate = useInvalidateProgress();
  return useMutation({
    mutationFn: async (topicId) => (await api.post(`/progress/topics/${topicId}/complete`)).data,
    onSuccess: (data) => {
      setUser(data.user);
      invalidate();
    },
  });
}

export function useUpdateProgress(topicId) {
  const invalidate = useInvalidateProgress();
  return useMutation({
    mutationFn: async (patch) => (await api.patch(`/progress/topics/${topicId}`, patch)).data.progress,
    onSuccess: invalidate,
  });
}

export const sendHeartbeat = (topicId, body) => api.post(`/progress/topics/${topicId}/heartbeat`, body);
