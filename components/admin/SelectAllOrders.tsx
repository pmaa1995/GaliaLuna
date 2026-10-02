"use client";

// Toggles every order checkbox bound to the bulk form; without JavaScript each box still works on its own.
export default function SelectAllOrders({ formId }: { formId: string }) {
  return (
    <button
      type="button"
      className="adm-btn"
      onClick={() => {
        const boxes = [...document.querySelectorAll<HTMLInputElement>(`input[form="${formId}"][name="orderIds"]`)];
        const allChecked = boxes.every((box) => box.checked);
        boxes.forEach((box) => { box.checked = !allChecked; });
      }}
    >
      Marcar todos
    </button>
  );
}
