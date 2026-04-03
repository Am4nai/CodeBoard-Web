import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { api } from "../../api/axiosInstance";

interface ModalProps {
  postId: number;
  onClose: () => void;
}

export default function AddToCollectionModal({ postId, onClose }: ModalProps) {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    api.get("/collections").then((res) => setCollections(res.data));
  }, []);

  const modalRoot = document.getElementById("modal-root")!;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-9999"
      onClick={onClose}
    >
      <div
        className="bg-bg p-6 rounded-2xl shadow-3xl w-[90%] max-w-md text-text animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Add to collection</h2>

        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {collections.map((c: any) => (
            <button
              key={c.id}
              onClick={async () => {
                await api.post(`/collections/${c.id}/posts`, { postId });
                onClose();
              }}
              className="p-3 bg-surface rounded-lg hover:bg-surface-focus transition-colors text-left"
            >
              <p className="font-semibold">{c.name}</p>
              <p className="opacity-70 text-sm">{c.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-error hover:bg-error-hover p-2 rounded-lg text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>,
    modalRoot
  );
}
