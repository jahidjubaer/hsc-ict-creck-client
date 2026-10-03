import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export const examKeys = {
  overview: ['exam-overview'],
  attempt: (id) => ['attempt', id],
  history: (kind) => ['attempts', kind ?? 'all'],
  mistakes: ['mistakes'],
};

export const useExamOverview = () =>
  useQuery({ queryKey: examKeys.overview, queryFn: async () => (await api.get('/exams/overview')).data });

export const useAttempt = (id) =>
  useQuery({
    queryKey: examKeys.attempt(id),
    queryFn: async () => (await api.get(`/exams/attempts/${id}`)).data.attempt,
    refetchOnWindowFocus: false,
    retry: (count, err) => err?.response?.status !== 404 && count < 1,
  });

export const useMistakes = () =>
  useQuery({ queryKey: examKeys.mistakes, queryFn: async () => (await api.get('/exams/mistakes')).data });

/** Invalidate everything that shows scores/XP after a test changes. */
function useInvalidateScores() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: examKeys.overview });
    qc.invalidateQueries({ queryKey: ['attempts'] });
    qc.invalidateQueries({ queryKey: examKeys.mistakes });
    qc.invalidateQueries({ queryKey: ['chapter'] });
    qc.invalidateQueries({ queryKey: ['topic'] });
    qc.invalidateQueries({ queryKey: ['progress-summary'] });
  };
}

/** Starts (or resumes) a test and opens it. body: { kind, topicId?, chapterId? } */
export function useStartAttempt() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post('/exams/attempts', body)).data,
    onSuccess: ({ attempt, resumed }) => {
      qc.setQueryData(examKeys.attempt(attempt._id), attempt);
      if (resumed) toast('আগের অসমাপ্ত পরীক্ষাটি আবার খোলা হলো', { icon: '⏯️' });
      navigate(`/exams/attempts/${attempt._id}`);
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      if (err?.response?.status === 402) navigate('/subscribe');
    },
  });
}

/** Instant mode: lock one MCQ answer; patches the cached attempt with the revealed answer. */
export function useAnswerMcq(attemptId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, picked }) => (await api.post(`/exams/attempts/${attemptId}/mcq/${questionId}`, { picked })).data,
    onSuccess: (res, { questionId }) => {
      qc.setQueryData(examKeys.attempt(attemptId), (old) =>
        old && { ...old, mcq: old.mcq.map((m) => (m._id === questionId ? { ...m, ...res, locked: true } : m)) }
      );
    },
  });
}

export const saveDraft = (attemptId, draft) => api.patch(`/exams/attempts/${attemptId}/answers`, draft);

export function useSubmitAttempt(attemptId) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const invalidate = useInvalidateScores();
  return useMutation({
    mutationFn: async (draft) => (await api.post(`/exams/attempts/${attemptId}/submit`, draft ?? {})).data,
    onSuccess: (res) => {
      qc.setQueryData(examKeys.attempt(attemptId), { ...res.attempt, justSubmitted: { xp: res.xp, previousBest: res.previousBest } });
      if (res.user) setUser(res.user);
      invalidate();
    },
  });
}

export function useSelfMark(attemptId) {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const invalidate = useInvalidateScores();
  return useMutation({
    mutationFn: async ({ questionId, scores }) => (await api.post(`/exams/attempts/${attemptId}/cq/${questionId}/self`, { scores })).data,
    onSuccess: (res) => {
      qc.setQueryData(examKeys.attempt(attemptId), (old) => ({ ...res.attempt, justSubmitted: old?.justSubmitted }));
      if (res.user) setUser(res.user);
      if (res.xp) toast.success(`+${res.xp} XP`);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useRetryMistake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, picked }) => (await api.post(`/exams/mistakes/${id}/retry`, { picked })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.overview }),
  });
}
