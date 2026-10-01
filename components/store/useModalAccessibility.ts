"use client";

import { useEffect, useRef, type RefObject } from "react";

const modalStack: Array<{ token: symbol; dialog: HTMLElement }> = [];
const inertElements = new WeakMap<HTMLElement, { count: number; wasInert: boolean }>();
let previousBodyOverflow = "";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared by nested dialogs so only the top dialog handles focus and Escape. */
export default function useModalAccessibility<T extends HTMLElement>(
  dialogRef: RefObject<T | null>,
  open: boolean,
  onClose: () => void,
  canDismiss = true,
) {
  const callbacks = useRef({ onClose, canDismiss });
  useEffect(() => {
    callbacks.current = { onClose, canDismiss };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const token = Symbol("dialog");
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (modalStack.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    modalStack.push({ token, dialog });

    // Exclude siblings at every ancestor level, including the page behind a nested dialog.
    const siblings: HTMLElement[] = [];
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (!(sibling instanceof HTMLElement) || sibling === branch ||
            ["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) continue;
        const state = inertElements.get(sibling) ?? { count: 0, wasInert: sibling.inert };
        state.count += 1;
        inertElements.set(sibling, state);
        sibling.inert = true;
        siblings.push(sibling);
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }

    const isTopModal = () => modalStack[modalStack.length - 1]?.token === token;
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0 &&
        !element.closest("[inert]") && getComputedStyle(element).visibility !== "hidden");
    const focusFirst = () => {
      const initial = dialog.querySelector<HTMLElement>("[data-modal-initial-focus]");
      (initial ?? focusables()[0] ?? dialog).focus({ preventScroll: true });
    };
    focusFirst();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (callbacks.current.canDismiss) callbacks.current.onClose();
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first ||
                 document.activeElement === dialog || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last ||
                 !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isTopModal() && event.target instanceof Node && !dialog.contains(event.target)) focusFirst();
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      const wasTopModal = isTopModal();
      const stackIndex = modalStack.findIndex((entry) => entry.token === token);
      if (stackIndex !== -1) modalStack.splice(stackIndex, 1);
      for (const sibling of siblings) {
        const state = inertElements.get(sibling);
        if (!state) continue;
        state.count -= 1;
        if (state.count === 0) {
          sibling.inert = state.wasInert;
          inertElements.delete(sibling);
        }
      }
      if (modalStack.length === 0) document.body.style.overflow = previousBodyOverflow;
      if (wasTopModal) {
        if (previousFocus?.isConnected && !previousFocus.closest("[inert]") && !previousFocus.matches(":disabled")) {
          previousFocus.focus({ preventScroll: true });
        } else {
          // Submitting can remove or disable the trigger; keep focus in its parent dialog.
          modalStack[modalStack.length - 1]?.dialog.focus({ preventScroll: true });
        }
      }
    };
  }, [dialogRef, open]);
}
