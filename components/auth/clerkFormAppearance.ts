// Colors and shape come from the storefront tokens; layout details live in app/storefront.css (.auth .cl-*).
export const clerkFormAppearance = {
  variables: {
    colorPrimary: "#4b8e80",
    colorText: "#2c2a27",
    colorTextSecondary: "#5e5851",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#2c2a27",
    colorDanger: "#a8453b",
    borderRadius: "0px",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  layout: {
    logoPlacement: "none",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
  },
} as const;
