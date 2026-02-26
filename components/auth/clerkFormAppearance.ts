export const clerkFormAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-[560px]",
    card: "w-full border-0 bg-transparent shadow-none rounded-none",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    main: "gap-4 sm:gap-5",
    socialButtonsBlockButton:
      "rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] shadow-none hover:bg-[color:var(--paper)]",
    socialButtonsBlockButtonText: "text-[color:var(--ink)] font-medium",
    dividerLine: "bg-[color:var(--line)]",
    dividerText:
      "text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-soft)]",
    formFieldLabel:
      "text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]",
    formFieldInput:
      "h-11 rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)] shadow-none focus:border-[color:var(--brand-sage)] focus:ring-1 focus:ring-[color:var(--brand-sage)]",
    formButtonPrimary:
      "h-11 rounded-[12px] border-0 bg-[color:var(--brand-sage)] text-[color:var(--ink)] shadow-none hover:opacity-95",
    footer: "mt-3 border-t border-[color:var(--line)] bg-transparent pt-3 sm:mt-4 sm:pt-4",
    footerActionText: "text-[color:var(--ink-soft)]",
    footerActionLink: "font-semibold text-[color:var(--ink)] hover:opacity-80",
    formFieldAction: "text-[color:var(--ink)] hover:opacity-80",
    formResendCodeLink: "text-[color:var(--ink)] hover:opacity-80",
    otpCodeFieldInput:
      "rounded-[12px] border border-[color:var(--line)] bg-[color:var(--bg-soft)] text-[color:var(--ink)]",
    identityPreviewText: "text-[color:var(--ink-soft)]",
    identityPreviewEditButton: "text-[color:var(--ink)] hover:opacity-80",
    alertText: "text-sm",
  },
} as const;
