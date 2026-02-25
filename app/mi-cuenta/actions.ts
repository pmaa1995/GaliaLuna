"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

function text(formData: FormData, key: string, max = 180) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function saveAccountProfileAction(formData: FormData) {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Unauthorized");
  }

  const firstName = text(formData, "firstName", 80);
  const lastName = text(formData, "lastName", 80);

  const profile = {
    deliveryPhone: text(formData, "deliveryPhone", 30),
    alternatePhone: text(formData, "alternatePhone", 30),
    province: text(formData, "province", 80),
    city: text(formData, "city", 80),
    sector: text(formData, "sector", 120),
    addressLine1: text(formData, "addressLine1", 180),
    addressLine2: text(formData, "addressLine2", 180),
    reference: text(formData, "reference", 220),
    deliveryNotes: text(formData, "deliveryNotes", 320),
  };

  const missingRequired = [
    firstName,
    lastName,
    profile.deliveryPhone,
    profile.province,
    profile.city,
    profile.addressLine1,
  ].some((value) => !value);

  if (missingRequired) {
    redirect("/mi-cuenta?perfil=error");
  }

  const client = await clerkClient();
  const existingUser = await client.users.getUser(session.userId);
  const unsafe =
    existingUser.unsafeMetadata && typeof existingUser.unsafeMetadata === "object"
      ? (existingUser.unsafeMetadata as Record<string, unknown>)
      : {};

  await client.users.updateUser(session.userId, {
    firstName,
    lastName,
    unsafeMetadata: {
      ...unsafe,
      galiaLunaProfile: profile,
    },
  });

  revalidatePath("/mi-cuenta");
  redirect("/mi-cuenta?perfil=guardado");
}
