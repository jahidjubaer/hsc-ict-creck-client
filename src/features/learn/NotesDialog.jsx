import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { NotebookPen, Save } from 'lucide-react';

/** Personal note for a topic, stored with the student's progress. */
export function NotesDialog({ open, onClose, initial, onSave }) {
  const ref = useRef(null);
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(text);
      toast.success('নোট সংরক্ষণ হয়েছে');
      onClose();
    } catch {
      toast.error('নোট সংরক্ষণ করা যায়নি');
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <NotebookPen className="size-5 text-primary" /> আমার নোট
        </h3>
        <p className="mt-1 text-sm text-base-content/60">নিজের ভাষায় লিখলে মনে থাকে বেশি। শুধু তুমিই দেখতে পাবে।</p>
        <textarea
          className="textarea mt-4 h-48 w-full"
          value={text}
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
          placeholder="যেমন: বাইনারিতে ভাগশেষ নিচ থেকে উপরে পড়তে হয়…"
        />
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            বাতিল
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="size-4" />} সংরক্ষণ
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
