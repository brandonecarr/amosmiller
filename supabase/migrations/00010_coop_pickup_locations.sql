-- Insert all co-op pickup locations
INSERT INTO fulfillment_locations (name, slug, type, is_coop, is_active, city, state, sort_order)
VALUES
  ('AL - Auburn',                      'al-auburn',                      'pickup', true, true, 'Auburn',                'Alabama',        1),
  ('AL - Birmingham',                  'al-birmingham',                  'pickup', true, true, 'Birmingham',            'Alabama',        2),
  ('AZ - Phoenix',                     'az-phoenix',                     'pickup', true, true, 'Phoenix',               'Arizona',        3),
  ('CA - Pasadena/Claremont',          'ca-pasadena-claremont',          'pickup', true, true, 'Pasadena/Claremont',    'California',     4),
  ('CA - San Jose',                    'ca-san-jose',                    'pickup', true, true, 'San Jose',              'California',     5),
  ('CA - Murrieta',                    'ca-murrieta',                    'pickup', true, true, 'Murrieta',              'California',     6),
  ('CO - Lakewood',                    'co-lakewood',                    'pickup', true, true, 'Lakewood',              'Colorado',       7),
  ('FL - Orlando',                     'fl-orlando',                     'pickup', true, true, 'Orlando',               'Florida',        8),
  ('FL - Titusville',                  'fl-titusville',                  'pickup', true, true, 'Titusville',            'Florida',        9),
  ('FL - Tampa',                       'fl-tampa',                       'pickup', true, true, 'Tampa',                 'Florida',       10),
  ('FL - Winter Haven Polk County',    'fl-winter-haven-polk-county',    'pickup', true, true, 'Winter Haven',          'Florida',       11),
  ('MA - Chelsea',                     'ma-chelsea',                     'pickup', true, true, 'Chelsea',               'Massachusetts', 12),
  ('MA - Carlisle',                    'ma-carlisle',                    'pickup', true, true, 'Carlisle',              'Massachusetts', 13),
  ('NJ - Williamstown',               'nj-williamstown',                'pickup', true, true, 'Williamstown',          'New Jersey',    14),
  ('NV - Las Vegas',                   'nv-las-vegas',                   'pickup', true, true, 'Las Vegas',             'Nevada',        15),
  ('TX - Austin',                      'tx-austin',                      'pickup', true, true, 'Austin',                'Texas',         16);
