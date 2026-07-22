-- ============================================================
-- SANEAS · Semilla de alimentos GENÉRICOS (valores por 100 g)
-- Ejecutar DESPUÉS de fase1_diario.sql. Idempotente: si un nombre
-- ya existe, no lo duplica.
--
-- ⚠️ REVISIÓN DE OSCAR: valores estándar de tablas de composición
-- (estilo BEDCA), redondeados. Son el punto de partida para que el
-- diario funcione hoy; corrígelos o amplíalos cuando quieras con:
--   update alimentos set kcal_100=… where nombre='…';
-- Los pesos son de alimento COCINADO cuando así se indica.
-- ============================================================

insert into public.alimentos (nombre, origen, kcal_100, prot_100, hc_100, grasa_100, categoria)
select v.nombre, 'saneas', v.kcal, v.prot, v.hc, v.grasa, v.cat
from (values
  -- Carnes y aves
  ('Pechuga de pollo a la plancha',        165, 31.0,  0.0,  3.6, 'Carnes'),
  ('Muslo de pollo asado sin piel',        190, 26.0,  0.0,  9.0, 'Carnes'),
  ('Pechuga de pavo a la plancha',         135, 29.0,  0.0,  1.5, 'Carnes'),
  ('Lomo de cerdo a la plancha',           195, 27.0,  0.0,  9.5, 'Carnes'),
  ('Ternera magra a la plancha',           170, 28.0,  0.0,  6.0, 'Carnes'),
  ('Carne picada mixta cocinada',          230, 24.0,  0.0, 15.0, 'Carnes'),
  ('Conejo guisado',                       160, 28.0,  0.0,  5.0, 'Carnes'),
  ('Jamón serrano',                        220, 30.0,  0.5, 11.0, 'Carnes'),
  ('Jamón cocido',                         110, 19.0,  1.5,  3.0, 'Carnes'),
  ('Pechuga de pavo en lonchas',           100, 19.0,  1.5,  2.0, 'Carnes'),
  -- Pescados y marisco
  ('Merluza al horno',                      90, 17.0,  0.0,  2.5, 'Pescados'),
  ('Salmón a la plancha',                  200, 22.0,  0.0, 12.0, 'Pescados'),
  ('Atún fresco a la plancha',             145, 26.0,  0.0,  4.5, 'Pescados'),
  ('Atún en conserva al natural',          105, 24.0,  0.0,  1.0, 'Pescados'),
  ('Sardinas a la plancha',                190, 22.0,  0.0, 11.0, 'Pescados'),
  ('Dorada al horno',                      110, 20.0,  0.0,  3.5, 'Pescados'),
  ('Bacalao cocinado',                     100, 22.0,  0.0,  1.0, 'Pescados'),
  ('Gambas cocidas',                        90, 20.0,  0.5,  1.0, 'Pescados'),
  ('Mejillones cocidos',                   110, 16.0,  3.5,  3.0, 'Pescados'),
  -- Huevos y lácteos
  ('Huevo cocido',                         145, 12.5,  0.7, 10.0, 'Huevos y lácteos'),
  ('Tortilla francesa (1 huevo + aceite)', 175, 12.0,  0.7, 13.5, 'Huevos y lácteos'),
  ('Clara de huevo',                        48, 10.5,  0.7,  0.2, 'Huevos y lácteos'),
  ('Leche semidesnatada',                   46,  3.2,  4.7,  1.6, 'Huevos y lácteos'),
  ('Leche entera',                          63,  3.1,  4.7,  3.6, 'Huevos y lácteos'),
  ('Yogur natural',                         60,  4.0,  5.5,  2.5, 'Huevos y lácteos'),
  ('Yogur griego natural',                 115,  6.0,  4.5,  9.0, 'Huevos y lácteos'),
  ('Queso fresco batido 0%',                45,  8.0,  4.0,  0.2, 'Huevos y lácteos'),
  ('Queso fresco tipo Burgos',             175, 12.0,  3.5, 13.0, 'Huevos y lácteos'),
  ('Queso curado',                         400, 26.0,  1.5, 32.0, 'Huevos y lácteos'),
  ('Requesón',                             140, 12.0,  3.5,  9.0, 'Huevos y lácteos'),
  -- Legumbres (cocidas)
  ('Lentejas cocidas',                     115,  9.0, 17.0,  0.5, 'Legumbres'),
  ('Garbanzos cocidos',                    150,  8.5, 21.0,  2.5, 'Legumbres'),
  ('Alubias blancas cocidas',              105,  7.0, 16.0,  0.5, 'Legumbres'),
  ('Guisantes cocidos',                     80,  5.5, 11.0,  0.5, 'Legumbres'),
  ('Tofu',                                 125, 13.0,  2.0,  7.5, 'Legumbres'),
  -- Cereales, pan, pasta y arroz
  ('Arroz blanco cocido',                  130,  2.7, 28.0,  0.3, 'Cereales'),
  ('Arroz integral cocido',                120,  2.7, 24.0,  1.0, 'Cereales'),
  ('Pasta cocida',                         150,  5.5, 29.0,  1.0, 'Cereales'),
  ('Pasta integral cocida',                140,  6.0, 27.0,  1.5, 'Cereales'),
  ('Quinoa cocida',                        120,  4.4, 21.0,  1.9, 'Cereales'),
  ('Pan blanco',                           260,  8.5, 51.0,  1.5, 'Cereales'),
  ('Pan integral',                         230,  9.5, 41.0,  2.5, 'Cereales'),
  ('Copos de avena',                       370, 13.0, 59.0,  7.0, 'Cereales'),
  ('Patata cocida',                         85,  1.8, 19.0,  0.1, 'Cereales'),
  ('Patata asada',                          95,  2.0, 21.0,  0.1, 'Cereales'),
  ('Boniato asado',                         95,  1.5, 21.0,  0.2, 'Cereales'),
  ('Tortitas de arroz',                    390,  8.0, 82.0,  3.0, 'Cereales'),
  -- Verduras y hortalizas
  ('Ensalada mixta (lechuga y tomate)',     20,  1.0,  3.5,  0.2, 'Verduras'),
  ('Tomate',                                20,  1.0,  3.5,  0.2, 'Verduras'),
  ('Brócoli cocido',                        30,  3.0,  3.0,  0.4, 'Verduras'),
  ('Judías verdes cocidas',                 30,  1.9,  4.5,  0.2, 'Verduras'),
  ('Calabacín a la plancha',                20,  1.5,  2.5,  0.3, 'Verduras'),
  ('Berenjena asada',                       25,  1.0,  4.5,  0.2, 'Verduras'),
  ('Pimiento asado',                        30,  1.2,  5.5,  0.3, 'Verduras'),
  ('Espinacas cocidas',                     25,  3.0,  1.5,  0.3, 'Verduras'),
  ('Champiñones salteados',                 30,  2.5,  2.0,  1.0, 'Verduras'),
  ('Zanahoria cruda',                       35,  0.8,  7.5,  0.2, 'Verduras'),
  ('Cebolla',                               35,  1.2,  7.0,  0.2, 'Verduras'),
  ('Pepino',                                13,  0.7,  2.0,  0.1, 'Verduras'),
  ('Gazpacho casero',                       45,  1.0,  4.5,  2.5, 'Verduras'),
  -- Frutas
  ('Manzana',                               52,  0.3, 12.0,  0.2, 'Frutas'),
  ('Plátano',                               90,  1.1, 21.0,  0.3, 'Frutas'),
  ('Naranja',                               45,  0.9, 10.0,  0.2, 'Frutas'),
  ('Pera',                                  50,  0.4, 12.0,  0.1, 'Frutas'),
  ('Fresas',                                33,  0.7,  7.0,  0.3, 'Frutas'),
  ('Sandía',                                30,  0.6,  7.0,  0.2, 'Frutas'),
  ('Melón',                                 34,  0.8,  8.0,  0.2, 'Frutas'),
  ('Kiwi',                                  55,  1.1, 12.0,  0.5, 'Frutas'),
  ('Uvas',                                  70,  0.6, 17.0,  0.2, 'Frutas'),
  ('Aguacate',                             160,  2.0,  4.0, 15.0, 'Frutas'),
  ('Arándanos',                             57,  0.7, 12.0,  0.3, 'Frutas'),
  -- Frutos secos y aceites
  ('Nueces',                               655, 15.0, 10.0, 63.0, 'Frutos secos'),
  ('Almendras',                            600, 21.0, 17.0, 52.0, 'Frutos secos'),
  ('Crema de cacahuete',                   590, 25.0, 17.0, 50.0, 'Frutos secos'),
  ('Aceite de oliva virgen extra',         884,  0.0,  0.0,100.0, 'Aceites'),
  ('Aceitunas',                            150,  1.0,  3.5, 15.0, 'Aceites'),
  -- Bebidas y otros
  ('Café solo',                              2,  0.2,  0.0,  0.0, 'Bebidas'),
  ('Café con leche semidesnatada',          25,  1.7,  2.5,  0.9, 'Bebidas'),
  ('Cerveza',                               43,  0.5,  3.5,  0.0, 'Bebidas'),
  ('Vino tinto',                            85,  0.1,  2.5,  0.0, 'Bebidas'),
  ('Refresco de cola',                      42,  0.0, 10.5,  0.0, 'Bebidas'),
  ('Chocolate negro 85%',                  590, 10.0, 22.0, 48.0, 'Otros'),
  ('Miel',                                 320,  0.4, 80.0,  0.0, 'Otros'),
  ('Hummus',                               170,  7.0, 12.0, 10.0, 'Otros')
) as v(nombre, kcal, prot, hc, grasa, cat)
where not exists (
  select 1 from public.alimentos a where lower(a.nombre) = lower(v.nombre)
);
