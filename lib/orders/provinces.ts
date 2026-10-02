// The 31 provinces plus the Distrito Nacional; a fixed list keeps delivery data consistent.
export const DR_PROVINCES = [
  "Azua", "Bahoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte", "El Seibo", "Elías Piña",
  "Espaillat", "Hato Mayor", "Hermanas Mirabal", "Independencia", "La Altagracia", "La Romana", "La Vega",
  "María Trinidad Sánchez", "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia",
  "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan", "San Pedro de Macorís",
  "Sánchez Ramírez", "Santiago", "Santiago Rodríguez", "Santo Domingo", "Valverde",
] as const;

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLocaleLowerCase("es");

// Maps free text saved earlier ("distrito nacional", "Samana") to the canonical name, or "" if unknown.
export function matchProvince(value: string) {
  const key = fold(value);
  return DR_PROVINCES.find((province) => fold(province) === key) ?? "";
}
