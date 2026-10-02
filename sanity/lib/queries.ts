const productProjection = `{
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

export const allProductsQuery = `
  *[_type == "product" && defined(slug.current)] | order(_createdAt asc)
  ${productProjection}
`;

export const activeProductSlugsQuery = `
  *[_type == "product" && defined(slug.current) && coalesce(isActive, true) == true]{
    "slug": slug.current
  }
`;

export const productBySlugQuery = `
  *[_type == "product" && slug.current == $slug][0]
  ${productProjection}
`;

export const homeSettingsQuery = `
  *[_type == "homeSettings"][0]{
    heroProducts[]->${productProjection},
    featuredProduct->${productProjection}
  }
`;

