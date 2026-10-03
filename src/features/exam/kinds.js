// Exam kinds (server/src/config/exams.js): MCQ and CQ are separate tests at topic, chapter and full-book level.

export const KIND_LABEL = {
  topic: 'টপিক MCQ কুইজ',
  'topic-cq': 'টপিক সৃজনশীল',
  'chapter-mcq': 'অধ্যায় MCQ',
  'chapter-cq': 'অধ্যায় সৃজনশীল',
  full: 'MCQ মডেল টেস্ট',
  'full-cq': 'সৃজনশীল মডেল টেস্ট',
  chapter: 'অধ্যায় পরীক্ষা',
};

export const levelOf = (kind) => (kind.startsWith('topic') ? 'topic' : kind.startsWith('chapter') ? 'chapter' : 'full');

/** Body for starting the same test again (the old combined chapter test restarts as the chapter MCQ test). */
export function retryBody(attempt) {
  const kind = attempt.kind === 'chapter' ? 'chapter-mcq' : attempt.kind;
  const level = levelOf(kind);
  if (level === 'topic') return { kind, topicId: attempt.topic?._id };
  if (level === 'chapter') return { kind, chapterId: attempt.chapter?._id };
  return { kind };
}
