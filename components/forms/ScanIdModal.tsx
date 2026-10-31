"use client";

import Modal from "../ui/Modal";

export default function ScanIdModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Scan ID" description="Coming soon">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600">
          ⌗
        </div>
        <p className="text-sm text-gray-600">
          Scanning patient ID cards will arrive in a future update. For now, enter the ID manually when scheduling a visit.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}