-- Populate category images from Supabase storage
-- Images were downloaded from amosmillerorganicfarm.com and uploaded to the product-images bucket
-- Matches on name (case-insensitive) — only updates categories without an existing image
-- For a full re-upload from source, run: node scripts/upload-category-images.mjs

UPDATE categories SET image_url = src.image_url
FROM (VALUES
  ('A2/A2 Dairy',            'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/a2a2-dairy.png'),
  ('Cheese',                 'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/cheese.jpg'),
  ('Water Buffalo',          'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/water-buffalo.jpg'),
  ('Bone Broth',             'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/bone-broth.jpg'),
  ('Pastured Chicken',       'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/pastured-chicken.jpg'),
  ('Pastured Turkey',        'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/pastured-turkey.jpg'),
  ('Fertile Eggs',           'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/fertile-eggs.jpg'),
  ('Raw Pet Food',           'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/raw-pet-food.jpg'),
  ('Rabbit',                 'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/rabbit.png'),
  ('Seafood',                'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/seafood.jpg'),
  ('Farm Produce',           'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/farm-produce.jpg'),
  ('Fermented Vegetables',   'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/fermented-vegetables.jpg'),
  ('Pickled Vegetables',     'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/pickled-vegetables.jpg'),
  ('Bakery',                 'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/bakery.jpg'),
  ('Drinks',                 'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/drinks.png'),
  ('Probiotic Cultures',     'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/probiotic-cultures.jpg'),
  ('Ice Cream',              'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/ice-cream.jpg'),
  ('Healthy Treats',         'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/healthy-treats.jpg'),
  ('Staples',                'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/staples.jpg'),
  ('Crispy Nuts',            'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/crispy-nuts.jpg'),
  ('Traditional Fats',       'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/traditional-fats.jpg'),
  ('Green Pastures',         'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/green-pastures.png'),
  ('Rosita Real Foods',      'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/rosita-real-foods.jpg'),
  ('Beauty Products',        'https://eqlghlbhuemcpjvpeahh.supabase.co/storage/v1/object/public/product-images/categories/beauty-products.jpg')
) AS src(name, image_url)
WHERE categories.image_url IS NULL
  AND LOWER(categories.name) = LOWER(src.name);
