import { esMX } from "@clerk/localizations";

// es-MX is the closest base; the store speaks in "tú", so the visible auth copy is aligned here.
export const clerkLocalization = {
  ...esMX,
  formFieldInputPlaceholder__emailAddress: "tu@correo.com",
  signIn: {
    ...esMX.signIn,
    start: {
      ...esMX.signIn?.start,
      title: "Iniciar sesión",
      titleCombined: "Iniciar sesión",
      subtitle: "Accede con tu correo electrónico.",
      actionText: "¿Aún no tienes cuenta?",
      actionLink: "Crear cuenta",
    },
    emailCode: {
      ...esMX.signIn?.emailCode,
      title: "Revisa tu correo",
      subtitle: "Escribe el código que te enviamos para entrar.",
    },
    password: {
      ...esMX.signIn?.password,
      title: "Escribe tu contraseña",
      subtitle: "Para entrar a tu cuenta Galia Luna.",
    },
  },
  signUp: {
    ...esMX.signUp,
    start: {
      ...esMX.signUp?.start,
      title: "Crea tu cuenta",
      titleCombined: "Crea tu cuenta",
      subtitle: "Solo te tomará un minuto.",
      subtitleCombined: "Solo te tomará un minuto.",
      actionText: "¿Ya tienes cuenta?",
      actionLink: "Iniciar sesión",
    },
    emailCode: {
      ...esMX.signUp?.emailCode,
      title: "Confirma tu correo",
      subtitle: "Escribe el código que te enviamos.",
    },
  },
};
