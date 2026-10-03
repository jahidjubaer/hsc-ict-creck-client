import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { GuestOnly, RequireAdmin, RequireAuth } from '@/features/auth/guards';
import { RouteError } from '@/components/layout/RouteError';
import { PageLoader } from '@/components/ui/PageLoader';

// Pages are code-split; each module exports `default`.
const page = (loader) => async () => ({ Component: (await loader()).default });

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader full />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, lazy: page(() => import('@/features/landing/LandingPage')) },
          { path: 'pricing', lazy: page(() => import('@/features/pricing/PricingPage')) },
          {
            element: <GuestOnly />,
            children: [
              { path: 'login', lazy: page(() => import('@/features/auth/LoginPage')) },
              { path: 'register', lazy: page(() => import('@/features/auth/RegisterPage')) },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'dashboard', lazy: page(() => import('@/features/dashboard/DashboardPage')) },
              { path: 'learn', lazy: page(() => import('@/features/learn/ChaptersPage')) },
              { path: 'learn/:chapterSlug', lazy: page(() => import('@/features/learn/ChapterPage')) },
              { path: 'learn/:chapterSlug/:topicSlug', lazy: page(() => import('@/features/learn/TopicPage')) },
              { path: 'exams', lazy: page(() => import('@/features/exam/ExamsPage')) },
              { path: 'exams/mistakes', lazy: page(() => import('@/features/exam/MistakesPage')) },
              { path: 'exams/attempts/:id', lazy: page(() => import('@/features/exam/AttemptPage')) },
              { path: 'plan', lazy: page(() => import('@/features/plan/PlanPage')) },
              { path: 'leaderboard', lazy: page(() => import('@/features/gamification/LeaderboardPage')) },
              { path: 'badges', lazy: page(() => import('@/features/gamification/BadgesPage')) },
              { path: 'profile', lazy: page(() => import('@/features/profile/ProfilePage')) },
              { path: 'subscribe', lazy: page(() => import('@/features/subscription/SubscribePage')) },
              { path: 'subscribe/:planKey', lazy: page(() => import('@/features/subscription/SubscribePage')) },
              {
                path: 'admin',
                element: <RequireAdmin />,
                children: [
                  {
                    lazy: page(() => import('@/features/admin/AdminLayout')),
                    children: [
                      { index: true, lazy: page(() => import('@/features/admin/AdminHome')) },
                      { path: 'payments', lazy: page(() => import('@/features/admin/PaymentsPage')) },
                      { path: 'users', lazy: page(() => import('@/features/admin/UsersPage')) },
                      { path: 'users/:id', lazy: page(() => import('@/features/admin/UserDetail')) },
                      { path: 'ai', lazy: page(() => import('@/features/admin/AiReviewPage')) },
                      { path: 'questions', lazy: page(() => import('@/features/admin/QuestionsPage')) },
                      { path: 'questions/:id', lazy: page(() => import('@/features/admin/QuestionEdit')) },
                      { path: 'settings', lazy: page(() => import('@/features/admin/SettingsPage')) },
                    ],
                  },
                ],
              },
              { path: '*', lazy: page(() => import('@/components/layout/ComingSoon')) },
            ],
          },
        ],
      },
      ...(import.meta.env.DEV
        ? [
            { path: 'dev/widgets', lazy: page(() => import('@/features/dev/WidgetGallery')) },
            { path: 'dev/lesson/:chapter/:slug', lazy: page(() => import('@/features/dev/LessonPreview')) },
          ]
        : []),
      { path: '*', lazy: page(() => import('@/components/layout/NotFound')) },
    ],
  },
]);
