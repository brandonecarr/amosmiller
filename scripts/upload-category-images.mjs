/**
 * Downloads category images from amosmillerorganicfarm.com and uploads
 * them to Supabase storage, then updates the categories table.
 *
 * Usage: node scripts/upload-category-images.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Try loading from .env.local
  const { readFileSync } = await import("fs");
  const envFile = readFileSync(".env.local", "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "product-images";

// All category images scraped from the WooCommerce Store API
const CATEGORY_IMAGES = [
  // Top-level categories
  { slug: "meats-only", name: "Meats Only", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2023/12/meats-only-meat-pic.jpg" },
  { slug: "a2a2-diary", name: "A2/A2 Dairy", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/a2-milk-buffalo.png" },
  { slug: "cheese", name: "Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/12/thZPUHNH8T.jpg" },
  { slug: "buffalo", name: "Water Buffalo", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/Wasserbueffel_4843.jpg" },
  { slug: "bone-broth", name: "Bone Broth", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/brothgelatin_1024x536.jpg" },
  { slug: "100-pastured-chicken", name: "Pastured Chicken", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/chicken1.jpg" },
  { slug: "pastured-turkey", name: "Pastured Turkey", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/pastured-turkey.jpg" },
  { slug: "eggs", name: "Fertile Eggs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/eggs.jpg" },
  { slug: "raw-pet-food", name: "Raw Pet Food", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/pet-food.jpg" },
  { slug: "rabbit", name: "Rabbit", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/rabbits.png" },
  { slug: "seafood", name: "Seafood", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/MG_6809.jpg" },
  { slug: "vegetables", name: "Farm Produce", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/05/garden-veggies.jpg" },
  { slug: "fermented-vegetables", name: "Fermented Vegetables", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/fermented-food.jpg" },
  { slug: "pickled-vegetables", name: "Pickled Vegetables", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/packed-jars.jpg" },
  { slug: "bakery", name: "Bakery", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/bread-image.jpg" },
  { slug: "drinks", name: "Drinks", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/10-Kvass-Top-Fermented-Foods.png" },
  { slug: "cultures", name: "Probiotic Cultures", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/kefir-culture.jpg" },
  { slug: "ice-cream", name: "Ice Cream", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/Schlonegers-Home-Made-Ice-Cream.jpg" },
  { slug: "treats", name: "Healthy Treats", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/treats.jpg" },
  { slug: "staples", name: "Staples", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Healthy-Mayonnaise-Recipe.jpg" },
  { slug: "crispy-nuts", name: "Crispy Nuts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/nuts-image.jpg" },
  { slug: "healthy-fats", name: "Traditional Fats", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/lard-and-tallow.jpg" },
  { slug: "green-pastures", name: "Green Pastures", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/BLUE-ICE.png" },
  { slug: "rosita-real-foods", name: "Rosita Real Foods", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/003001_Rosita_EVCLO.jpg" },
  { slug: "beauty-products", name: "Beauty Products", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/soap-image.jpg" },
  { slug: "on-sale", name: "On Sale", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/sale-sign.jpg" },

  // Meats subcategories
  { slug: "special-meat-boxes", name: "Special Meat Boxes", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2023/12/mystery-box.jpg" },
  { slug: "meats-only-ground-beef-meats-only", name: "Ground Beef", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/ground-beef-patties-1000.jpg" },
  { slug: "meats-only-steaks", name: "Steaks", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/wellcow-facebookJumbo.jpg" },
  { slug: "meats-only-roast", name: "Roast", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/goat-roast-1.jpg" },
  { slug: "meats-only-other-cuts", name: "Other Cuts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/07/herd.jpg" },
  { slug: "meats-only-beef-bones-meats-only", name: "Beef Bones", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/beef-bones-494x600.jpg" },
  { slug: "meats-only-beef-organs-meats-only", name: "Beef Organs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/beef-liver-3.jpg" },
  { slug: "meats-only-beef-broth", name: "Beef Broth", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/05/brothgelatin_1024x536.jpg" },
  { slug: "meats-only-raw-beef-fat", name: "Raw Beef Fat", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/healthy-fats.jpg" },
  { slug: "beef-tallow", name: "Beef Tallow", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/lard-and-tallow-1.jpg" },
  { slug: "milk-fed-and-grass-finished-veal", name: "Veal", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/calf-cow-pasture-019376.jpg" },
  { slug: "pastured-lamb", name: "Lamb", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Google-s-Thanksgiving-Balloons-and-Bing-s-Traditional-Lamb-3.jpg" },
  { slug: "meats-only-goat", name: "Goat", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Goat_face.jpg" },
  { slug: "pork-meat", name: "Pork Meat", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/08/meats.jpg" },
  { slug: "meats-only-ground-pork", name: "Ground Pork", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/921cef0707af57333fb24265b138652c-sandwich-board-little-pigs-3.jpg" },
  { slug: "meats-only-pork-ham", name: "Pork Ham", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/cured-ham-hocks.jpg" },
  { slug: "pork-sausages", name: "Pork Sausages", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/links.jpg" },
  { slug: "meats-only-pork-organs", name: "Pork Organs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/WEB_pigs_ominvores.jpg" },
  { slug: "meats-only-pork-lard", name: "Pork Lard", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/01/lard-e1547072325484.jpg" },

  // Dairy subcategories
  { slug: "a2a2-raw-milk-and-diary", name: "A2/A2 Cow Milk", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/Goatmilk.jpg" },
  { slug: "cream", name: "A2/A2 Cream", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/separate-cream-from-milk.jpg" },
  { slug: "cow-butter", name: "A2/A2 Cow Butter", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/cow-butter.jpg" },
  { slug: "raw-colostrum", name: "A2/A2 Colostrum", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/first-colostrum.jpg" },
  { slug: "a2a2-raw-milk-kefir-and-yogurt", name: "A2/A2 Cow Kefir and Yogurt", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/fermentedfood-dairy.jpg" },
  { slug: "flavored-milk-a2a2-diary", name: "A2/A2 Flavored Milk", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/Is-Chocolate-Milk-1-1.jpg" },
  { slug: "raw-a2-a2-liquid-whey", name: "A2/A2 Liquid Whey", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/whey-gallon.jpg" },
  { slug: "buttermilk-a2a2-diary", name: "A2/A2 Buttermilk", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/home-remedies-to-reduce-body-heat-buttermilk.jpg" },
  { slug: "a2-a2-smoothies", name: "A2/A2 Smoothies", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/05/STRAWBERRY-YOGURT-SMOOTHIE.jpg" },
  { slug: "water-buffalo-dairy", name: "A2/A2 Water Buffalo Dairy", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/a2-milk-buffalo.png" },
  { slug: "raw-camel-dairy", name: "A2/A2 Camel Dairy", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/camel-milk-2.jpg" },
  { slug: "a2-a2-donkey-milk", name: "A2/A2 Donkey Milk", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/milk-in-glass.jpg" },
  { slug: "raw-sheep-milk-dairy", name: "A2/A2 Sheep Dairy", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/sheep-cap.jpg" },
  { slug: "raw-goat-milk-dairy", name: "A2/A2 Goat Dairy", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/08/greek-goat-quart-lid.jpg" },

  // Cheese subcategories
  { slug: "sheep-cheese", name: "A2/A2 Sheep Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/shepherdbasket.jpg" },
  { slug: "goat-cheese", name: "A2/A2 Goat Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/20140509-fresh-cheese-goat-thumb-610x406-400245.jpg" },
  { slug: "water-buffalo-cheese", name: "A2/A2 Water Buffalo Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/06/buff-cheese-2.jpg" },
  { slug: "a2-a2-hard-cow-cheese", name: "A2/A2 Hard Cow Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/cheese-image.jpg" },
  { slug: "a2-a2-soft-cow-cheese", name: "A2/A2 Soft Cow Cheese", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/08/Cottage-Cheese.jpg" },

  // Buffalo subcategories
  { slug: "buffalo-meat-boxes", name: "Buffalo Meat Boxes", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2023/12/mystery-box.jpg" },
  { slug: "ground", name: "Ground", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/wasserbueffel-tiefwerder-salecker-02.jpg" },
  { slug: "steaks-buffalo", name: "Steaks", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Wasserbueffel_Heldernhof-2.jpg" },
  { slug: "roasts-buffalo", name: "Roasts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2021/08/water-buffalo.jpg" },
  { slug: "other-cuts-buffalo", name: "Other Cuts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Wasserbueffel-spazieren-durch-Kleindstadt_thumbnail_medium_4_3.jpg" },
  { slug: "organs", name: "Organs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/WATER-BUFFALO.png" },
  { slug: "bones", name: "Bones", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/WATER-BUFFALO.png" },
  { slug: "bologna-sausages", name: "Bologna/Sausages", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/WATER-BUFFALO.png" },
  { slug: "bacon-buffalo", name: "Bacon", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Wasserbueffel_4843.jpg" },
  { slug: "jerky-buffalo", name: "Jerky", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/wasserbueffel-in-erlensee-903c0edd-8a2c-42ff-844b-7a2597e2c848.jpg" },
  { slug: "tallow-buffalo", name: "Tallow/Raw Fat", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/wasserbueffel-tiefwerder-salecker-02.jpg" },
  { slug: "buffalo-pet-food", name: "Buffalo Pet Food", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/pet-food.jpg" },

  // Bone Broth subcategories
  { slug: "bone-broth-bone-broth", name: "Bone Broth", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/veggie-broth-in-jars-horix-0809.jpg" },
  { slug: "fish-broth", name: "Fish Broth", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/fish-broth.jpg" },

  // Chicken subcategories
  { slug: "whole-fryer-100-pastured-chicken", name: "Whole Fryer", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/03/millers-farm-chicken.jpg" },
  { slug: "breast", name: "Breast", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/chicken-on-pasture.jpg" },
  { slug: "legs-thighs", name: "Legs/Thighs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Phantom-Forest-Free-range-chickens.jpg" },
  { slug: "wings", name: "Wings", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/03/millers-farm-chicken.jpg" },
  { slug: "ground-chicken", name: "Ground Chicken", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/chicken-page.jpg" },
  { slug: "organs-100-pastured-chicken", name: "Organs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/chicken-page.jpg" },
  { slug: "parts", name: "Parts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/01/chicken-on-pasture.jpg" },
  { slug: "pot-pie", name: "Pot Pie", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/12/chicken-on-pasture.jpg" },

  // Turkey subcategories
  { slug: "whole-turkey", name: "Whole Turkey", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Wildturkeybuttercups-scaled.jpg" },
  { slug: "breast-pastured-turkey", name: "Breast", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/raising-backyard-turkeys.jpg" },
  { slug: "drumsticks-thighs", name: "Drumsticks/Thighs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Wildturkeybuttercups-scaled.jpg" },
  { slug: "wings-pastured-turkey", name: "Wings", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/pastured-turkey.jpg" },
  { slug: "organs-pastured-turkey", name: "Organs", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Wild_Turkey13.jpg" },
  { slug: "lunchmeat", name: "Lunchmeat", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Wildturkeybuttercups-scaled.jpg" },
  { slug: "sausage", name: "Sausage", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/pastured-turkey.jpg" },

  // Seafood subcategories
  { slug: "wild-frozen-fish", name: "Wild Frozen Fish", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/05/portion-salmon.jpg" },
  { slug: "wild-fish-broth", name: "Wild Fish Broth", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/06/fish-broth.jpg" },

  // Farm Produce subcategories
  { slug: "fruits", name: "Fresh Fruits", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2025/08/Honey-Crisp-Apples.webp" },
  { slug: "frozen-fruits", name: "Frozen Fruits", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/frozen-berries.jpg" },
  { slug: "vegetables-vegetables", name: "Fresh Vegetables", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/raw-and-red-and-golden-beets.jpg" },
  { slug: "frozen-vegetables", name: "Frozen Vegetables", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/SnowPeas.jpg" },
  { slug: "smal-large-box", name: "Organic Vegetable Box", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/medium-box.jpg" },

  // Bakery subcategories
  { slug: "breads", name: "Traditional Bread", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/06/sourdough-1-600x490.jpg" },
  { slug: "cakes", name: "Cakes", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/AFB_Carrot_Cake_Gee.jpg" },
  { slug: "cookies", name: "Cookies", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/1504183988_59a806b45566d.jpg" },
  { slug: "muffins", name: "Muffins", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/MUFFINS.jpg" },
  { slug: "pies", name: "Pies", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/P1015651.jpg" },
  { slug: "spelt-noodles", name: "Spelt Noodles", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/wholemeal-spelt-pasta-6.jpg" },
  { slug: "whole-grain-flour", name: "Whole Grain Flour", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2025/06/Spelt-flour.jpg" },

  // Drinks subcategories
  { slug: "fresh-juices", name: "Fresh Juices", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/Concord-Grape-Juice-Concentrates-1.jpg" },
  { slug: "orchard-juices", name: "Fermented Orchard Juices", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Noble-Muscadine-grape-vine.jpg" },
  { slug: "fermented-teaother-fermented-drinks", name: "Fermented Tea/Soda", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/06/water-kefir-2.jpg" },
  { slug: "fermented-vegetable-juice", name: "Fermented Vegetable Juice", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/vegetable.jpg" },
  { slug: "kombucha-scoby-kit", name: "Scoby Kits", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/How-to-Grow-a-Scoby-DSC_0787.jpg" },

  // Cultures subcategories
  { slug: "living-cultures", name: "Live Cultures", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/08/milk-kefir-grains.jpg" },

  // Treats subcategories
  { slug: "pumpkin-puree", name: "Pumpkin Puree", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2025/11/small-pumpkin.webp" },
  { slug: "butters", name: "Nut Butters", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/GettyImages-492664922.jpg" },
  { slug: "custard", name: "Custard", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Vanilla-Custard.jpg" },
  { slug: "fruit", name: "Fruit/Fruit Butter", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/homemade-apple-butter.jpg" },
  { slug: "jam", name: "Jam/Spreads", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/04/strawberry-jam-2.jpg" },
  { slug: "granola", name: "Granola", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/spelt-granola-cereal.jpg" },
  { slug: "healthy-sweeteners", name: "Healthy Sweeteners", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/03/millers-honey.jpg" },
  { slug: "popcorn", name: "Popcorn", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2017/12/Popcorn-kernels-yellow-scaled.webp" },
  { slug: "potato-chips", name: "Potato Chips", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/07/zerbe.jpg" },
  { slug: "jerky-treats", name: "Jerky", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/03/buffalo-stix.jpg" },

  // Staples subcategories
  { slug: "spices", name: "Spices", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/chinese-five-spice-2.jpg" },
  { slug: "condiments", name: "Condiments", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/01/Homemade-Mustard-Homemade-Ketchup.jpg" },

  // Nuts subcategories
  { slug: "organic-nuts", name: "Organic Nuts", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/nuts-and-seeds.jpg" },
  { slug: "organic-seeds", name: "Organic Seeds", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/cooked-pepitas.jpg" },

  // Traditional Fats subcategories
  { slug: "coconut-oil", name: "Coconut Oil", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/02/coconut-oil-1.jpg" },
  { slug: "ghee", name: "Ghee", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/02/ghee.jpg" },
  { slug: "tallow", name: "Tallow", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/lard-and-tallow.jpg" },
  { slug: "raw-fats", name: "Raw Fats", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/02/raw-fat.jpg" },
  { slug: "olive-oil", name: "Olive Oil", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/02/OLIVE-oil-for-hair-650x365.jpg" },

  // Beauty subcategories
  { slug: "soaps", name: "Soaps", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2019/04/goat-milk-soap.jpg" },
  { slug: "salvecreams", name: "Salve/Creams", url: "https://amosmillerorganicfarm.com/wp-content/uploads/2018/02/salve.jpg" },
];

function getExtFromUrl(url) {
  const pathname = new URL(url).pathname;
  const ext = pathname.split(".").pop().toLowerCase();
  // Normalize extensions
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "webp", "gif"].includes(ext)) return ext;
  return "jpg"; // fallback
}

function getContentType(ext) {
  const types = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  return types[ext] || "image/jpeg";
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; image-scraper/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadImage(slug, buffer, ext) {
  const path = `categories/${slug}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      cacheControl: "86400",
      upsert: true,
      contentType: getContentType(ext),
    });

  if (error) throw new Error(`Upload failed for ${slug}: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

async function main() {
  console.log("Fetching existing categories from database...");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug, image_url");

  if (catError) {
    console.error("Failed to fetch categories:", catError.message);
    process.exit(1);
  }

  console.log(`Found ${categories.length} categories in database\n`);

  // Build lookup maps
  const bySlug = new Map();
  const byName = new Map();
  for (const cat of categories) {
    bySlug.set(cat.slug, cat);
    byName.set(cat.name.toLowerCase(), cat);
  }

  let uploaded = 0;
  let matched = 0;
  let skipped = 0;
  let failed = 0;

  // De-duplicate source URLs to avoid downloading the same image twice
  const urlToPublicUrl = new Map();

  for (const item of CATEGORY_IMAGES) {
    // Match to a database category
    const cat = bySlug.get(item.slug) || byName.get(item.name.toLowerCase());
    if (!cat) {
      skipped++;
      continue;
    }

    matched++;

    // Skip if already has an image
    if (cat.image_url) {
      console.log(`  SKIP ${cat.name} (already has image)`);
      skipped++;
      continue;
    }

    try {
      let publicUrl = urlToPublicUrl.get(item.url);

      if (!publicUrl) {
        const ext = getExtFromUrl(item.url);
        console.log(`  Downloading ${item.name}...`);
        const buffer = await downloadImage(item.url);
        console.log(`  Uploading ${cat.slug}.${ext} (${(buffer.length / 1024).toFixed(0)}KB)...`);
        publicUrl = await uploadImage(cat.slug, buffer, ext);
        urlToPublicUrl.set(item.url, publicUrl);
      } else {
        // Same source image, but upload under this category's slug too
        const ext = getExtFromUrl(item.url);
        const buffer = await downloadImage(item.url);
        publicUrl = await uploadImage(cat.slug, buffer, ext);
      }

      // Update the category record
      const { error: updateError } = await supabase
        .from("categories")
        .update({ image_url: publicUrl })
        .eq("id", cat.id);

      if (updateError) {
        console.error(`  FAIL updating ${cat.name}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  OK   ${cat.name} -> ${publicUrl}`);
        uploaded++;
      }
    } catch (err) {
      console.error(`  FAIL ${cat.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Matched: ${matched}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
