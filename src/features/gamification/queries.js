import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useBadges = () => useQuery({ queryKey: ['badges'], queryFn: async () => (await api.get('/badges')).data.badges });

export const useLeaderboard = ({ period, scope }) =>
  useQuery({
    queryKey: ['leaderboard', period, scope],
    queryFn: async () => (await api.get('/leaderboard', { params: { period, scope } })).data,
    placeholderData: keepPreviousData,
  });

export const useActivity = (days = 182) =>
  useQuery({ queryKey: ['activity', days], queryFn: async () => (await api.get('/stats/activity', { params: { days } })).data });
