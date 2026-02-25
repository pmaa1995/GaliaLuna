import { groq } from "next-sanity";

const productProjection = groq`{
  _id,
  _type,
  name,
  slug,
  category,
  description,
  price,
  currency,
  "images": images[]{
    "url": asset->url,
    "alt": coalesce(alt, ^.name),
    "width": coalesce(asset->metadata.dimensions.width, 1200),
    "height": coalesce(asset->metadata.dimensions.height, 1200)
  },
  isActive,
  badge,
  inventory
}`;

export const allProductsQuery = groq`
  *[_type == "product" && defined(slug.current)] | order(_createdAt asc)
  ${productProjection}
`;

export const activeProductSlugsQuery = groq`
  *[_type == "product" && defined(slug.current) && coalesce(isActive, true) == true]{
    "slug": slug.current
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0]
  ${productProjection}
`;

export const homeSettingsQuery = groq`
  *[_type == "homeSettings"][0]{
    heroProducts[]->${productProjection},
    featuredProduct->${productProjection}
  }
`;

