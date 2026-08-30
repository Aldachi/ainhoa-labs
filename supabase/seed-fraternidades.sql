-- ============================================
-- Ch utillos 2026 - Rol de Ingreso oficial AFFAP
-- ============================================
--
-- Generado desde chutillos/scripts/mock-data.js, que es la fuente. Si el
-- rol cambia, se corrige alli y se vuelve a generar: transcribir dos veces
-- lo mismo es como se meten las diferencias entre el sitio y la base.
--
--   Dia 28 - Danzas Autoctonas   : 60 ingresos (6 grupos)
--   Dia 29 - Danzas Folkloricas  : 56 ingresos (5 grupos)
--   Dia 30 - Entrada Autoctona   : 47 ingresos (sin grupos)
--   Total                        : 163
--
-- entidad: institucion o comunidad que la presenta. En el dia 30 hay tres
-- "Sicuriada", tres "Jula Jula" y tres "Carnaval Blanco": sin la entidad
-- no se distinguen ni en el buscador ni en la pantalla del voluntario.
--
-- grupo: numero de grupo del afiche (dias 28 y 29). Es solo para cotejar
-- con el impreso; el orden que vale es orden_ingreso, que es global.
--
-- token_portador queda en null: no se usan portadores GPS.
--
-- Es un upsert por id, no un delete + insert. Un DELETE sobre
-- fraternidades arrastra en cascada los reportes de checkpoint y los pings
-- GPS ya cargados: correr esto en pleno evento para corregir un nombre
-- borraria el seguimiento del dia. Asi se puede volver a correr cuando
-- haga falta sin perder nada.
-- ============================================

begin;

insert into fraternidades
  (id, nombre, entidad, grupo, tipo, dia, modo_tracking, orden_ingreso, hora_estimada)
values
  ('fr-001', 'Comitiva', null, 1, 'autoctona', 28, 'checkpoint', 1, '08:30'),
  ('fr-002', 'Potolos Manuel Belgrano', null, 1, 'autoctona', 28, 'checkpoint', 2, '08:40'),
  ('fr-003', 'Tinkuy Los Huaynas Corazón de Jesús', null, 1, 'autoctona', 28, 'checkpoint', 3, '08:50'),
  ('fr-004', 'Tarqueada Simón Bolívar', null, 1, 'autoctona', 28, 'checkpoint', 4, '09:00'),
  ('fr-005', 'Potolos Kenny Prieto', null, 1, 'autoctona', 28, 'checkpoint', 5, '09:10'),
  ('fr-006', 'Mineritos Manuel Ascencio Padilla', null, 1, 'autoctona', 28, 'checkpoint', 6, '09:20'),
  ('fr-007', 'Calcheños Luis Felipe Manzano', null, 1, 'autoctona', 28, 'checkpoint', 7, '09:30'),
  ('fr-008', 'Tarqueada Macedonio Nogales', null, 1, 'autoctona', 28, 'checkpoint', 8, '09:40'),
  ('fr-009', 'Potolos Jadi', null, 1, 'autoctona', 28, 'checkpoint', 9, '09:50'),
  ('fr-010', 'Potosimanta 27 de Mayo', null, 1, 'autoctona', 28, 'checkpoint', 10, '10:10'),
  ('fr-011', 'Pastorcitos Antonio José de Sucre B', null, 2, 'autoctona', 28, 'checkpoint', 11, '10:20'),
  ('fr-012', 'Jalk''as Tomás Frías', null, 2, 'autoctona', 28, 'checkpoint', 12, '10:30'),
  ('fr-013', 'Tinku Aniceto Arce', null, 2, 'autoctona', 28, 'checkpoint', 13, '10:40'),
  ('fr-014', 'Tupiceños Santa Rosa', null, 2, 'autoctona', 28, 'checkpoint', 14, '10:55'),
  ('fr-015', 'Tarqueada 21 de Enero', null, 2, 'autoctona', 28, 'checkpoint', 15, '11:05'),
  ('fr-016', 'Potolos Oscar Alfaro', null, 2, 'autoctona', 28, 'checkpoint', 16, '11:15'),
  ('fr-017', 'Pastorcitos 6 de Junio', null, 2, 'autoctona', 28, 'checkpoint', 17, '11:25'),
  ('fr-018', 'Tupiceños Manuel Basconez', null, 2, 'autoctona', 28, 'checkpoint', 18, '11:35'),
  ('fr-019', 'Jalk''as Juan Pablo II', null, 2, 'autoctona', 28, 'checkpoint', 19, '11:45'),
  ('fr-020', 'Tinku Otto Felipe Braun', null, 2, 'autoctona', 28, 'checkpoint', 20, '11:55'),
  ('fr-021', 'Yureños Mariscal Sucre', null, 3, 'autoctona', 28, 'checkpoint', 21, '12:05'),
  ('fr-022', 'Calcheños L.N.A.D.I.', null, 3, 'autoctona', 28, 'checkpoint', 22, '12:15'),
  ('fr-023', 'Phutukum Enfermería', null, 3, 'autoctona', 28, 'checkpoint', 23, '12:25'),
  ('fr-024', 'Jalk''as Mejillones "B"', null, 3, 'autoctona', 28, 'checkpoint', 24, '12:35'),
  ('fr-025', 'Potosimanta Esfm-Ea', null, 3, 'autoctona', 28, 'checkpoint', 25, '12:45'),
  ('fr-026', 'Tinkuy Kussy Ñawy Kennedy', null, 3, 'autoctona', 28, 'checkpoint', 26, '12:55'),
  ('fr-027', 'Chacarera Alma Libre', null, 3, 'autoctona', 28, 'checkpoint', 27, '13:05'),
  ('fr-028', 'Carnaval Tarijeño Fund. Cultural Andaluz Tarija', null, 3, 'autoctona', 28, 'checkpoint', 28, '13:15'),
  ('fr-029', 'Tupiceños Catec', null, 3, 'autoctona', 28, 'checkpoint', 29, '13:25'),
  ('fr-030', 'Mineritos Ingeniería Minera', null, 3, 'autoctona', 28, 'checkpoint', 30, '13:35'),
  ('fr-031', 'Warak''aku Cantumarca', null, 4, 'autoctona', 28, 'checkpoint', 31, '13:45'),
  ('fr-032', 'Moseñada Monseñor Cleto Loayza', null, 4, 'autoctona', 28, 'checkpoint', 32, '13:55'),
  ('fr-033', 'Mineritos 1ro. de Abril', null, 4, 'autoctona', 28, 'checkpoint', 33, '14:05'),
  ('fr-034', 'Chacarera Flor de Quebracho', null, 4, 'autoctona', 28, 'checkpoint', 34, '14:20'),
  ('fr-035', 'Wititis Inbaljap', null, 4, 'autoctona', 28, 'checkpoint', 35, '14:30'),
  ('fr-036', 'Tarqueada Agronomía', null, 4, 'autoctona', 28, 'checkpoint', 36, '14:40'),
  ('fr-037', 'Mi Chura Tarija', null, 4, 'autoctona', 28, 'checkpoint', 37, '14:50'),
  ('fr-038', 'Calcheños Contabilidad y Finanzas', null, 4, 'autoctona', 28, 'checkpoint', 38, '15:00'),
  ('fr-039', 'Centro Cultural Quebradeños Carnaval Chicheño', null, 4, 'autoctona', 28, 'checkpoint', 39, '15:10'),
  ('fr-040', 'Wititis Centro Cultural Tolckas Villa Santiago', null, 4, 'autoctona', 28, 'checkpoint', 40, '15:20'),
  ('fr-041', 'Calcheños Pichincha', null, 5, 'autoctona', 28, 'checkpoint', 41, '15:30'),
  ('fr-042', 'Burru Khatis Topografía', null, 5, 'autoctona', 28, 'checkpoint', 42, '15:40'),
  ('fr-043', 'Tarqueada Ing. Desarrollo Rural', null, 5, 'autoctona', 28, 'checkpoint', 43, '15:50'),
  ('fr-044', 'Mineritos Jodis Zona San Cristóbal', null, 5, 'autoctona', 28, 'checkpoint', 44, '16:00'),
  ('fr-045', 'Juventud Potolos Villazón', null, 5, 'autoctona', 28, 'checkpoint', 45, '16:10'),
  ('fr-046', 'Tinkuy Ñawpa Tolck''as Huachacalla', null, 5, 'autoctona', 28, 'checkpoint', 46, '16:20'),
  ('fr-047', 'Gran Tarqueada de Ingenieros - Agrónomos', null, 5, 'autoctona', 28, 'checkpoint', 47, '16:30'),
  ('fr-048', 'Chacarera Pasión Chaqueña', null, 5, 'autoctona', 28, 'checkpoint', 48, '16:40'),
  ('fr-049', 'Residentes Tupiceños Carnaval Chicheño', null, 5, 'autoctona', 28, 'checkpoint', 49, '16:50'),
  ('fr-050', 'Wititis Ingeniería Mecánica', null, 5, 'autoctona', 28, 'checkpoint', 50, '17:00'),
  ('fr-051', 'Mineritos Sinchi Wayra', null, 6, 'autoctona', 28, 'checkpoint', 51, '17:10'),
  ('fr-052', 'Cultural Tinkuy "Los Tolckas" Zona Huachacalla', null, 6, 'autoctona', 28, 'checkpoint', 52, '17:20'),
  ('fr-053', 'Flor de Girasoles Filial Potosí - Teodora Flores', null, 6, 'autoctona', 28, 'checkpoint', 53, '18:05'),
  ('fr-054', 'Wititis Supay Marka', null, 6, 'autoctona', 28, 'checkpoint', 54, '18:15'),
  ('fr-055', 'Tinkuy Autóctono Huachacalla', null, 6, 'autoctona', 28, 'checkpoint', 55, '18:25'),
  ('fr-056', 'Mineritos F.U.L. - U.A.T.F.', null, 6, 'autoctona', 28, 'checkpoint', 56, '18:40'),
  ('fr-057', 'Zapateada Centro Cult. Artística Nueva Gener. Boliviana F. Potosí', null, 6, 'autoctona', 28, 'checkpoint', 57, '18:55'),
  ('fr-058', 'Mineritos de la Cooperativa Minera Nueva Calamarca', null, 6, 'autoctona', 28, 'checkpoint', 58, '19:05'),
  ('fr-059', 'Pandilla de Ravelo Flor de Girasoles Potosí', null, 6, 'autoctona', 28, 'checkpoint', 59, '19:15'),
  ('fr-060', 'Fraternidad Zapateo Los Kachamosos', null, 6, 'autoctona', 28, 'checkpoint', 60, '19:25'),
  ('fr-061', 'Comitiva', null, 1, 'folklorica', 29, 'checkpoint', 1, '08:00'),
  ('fr-062', 'Diablada Cultural y Artística Diablos Rojos Ex Alumnos Pichincha', null, 1, 'folklorica', 29, 'checkpoint', 2, '08:10'),
  ('fr-063', 'Sambos Caporales', null, 1, 'folklorica', 29, 'checkpoint', 3, '08:20'),
  ('fr-064', 'Llamarada San Andrés', null, 1, 'folklorica', 29, 'checkpoint', 4, '08:30'),
  ('fr-065', 'Salay Cristo Maestro', null, 1, 'folklorica', 29, 'checkpoint', 5, '08:40'),
  ('fr-066', 'Llamarada Andina Gualberto Villarroel', null, 1, 'folklorica', 29, 'checkpoint', 6, '08:55'),
  ('fr-067', 'Yotaleños Ayda Mendoza de Alurralde', null, 1, 'folklorica', 29, 'checkpoint', 7, '09:05'),
  ('fr-068', 'Negritos Odontología', null, 1, 'folklorica', 29, 'checkpoint', 8, '09:15'),
  ('fr-069', 'Morenada Sedcam', null, 1, 'folklorica', 29, 'checkpoint', 9, '09:30'),
  ('fr-070', 'Diablada Mcal. Andrés de Santa Cruz', null, 1, 'folklorica', 29, 'checkpoint', 10, '09:45'),
  ('fr-071', 'Antawaras Pacífico Sequeiros', null, 1, 'folklorica', 29, 'checkpoint', 11, '09:55'),
  ('fr-072', 'Suris Carlos Medinaceli', null, 1, 'folklorica', 29, 'checkpoint', 12, '10:10'),
  ('fr-073', 'Morenada Potosí', null, 1, 'folklorica', 29, 'checkpoint', 13, '10:25'),
  ('fr-074', 'Caporales Centralistas Socavón', null, 2, 'folklorica', 29, 'checkpoint', 14, '10:40'),
  ('fr-075', 'Llamarada Zona Norte', null, 2, 'folklorica', 29, 'checkpoint', 15, '10:50'),
  ('fr-076', 'Salay José David Berrios', null, 2, 'folklorica', 29, 'checkpoint', 16, '11:00'),
  ('fr-077', 'Diablada Artística Cultural Santa María', null, 2, 'folklorica', 29, 'checkpoint', 17, '11:10'),
  ('fr-078', 'Negritos Franciscanos', null, 2, 'folklorica', 29, 'checkpoint', 18, '11:20'),
  ('fr-079', 'Waca Wacas María Gutiérrez', null, 2, 'folklorica', 29, 'checkpoint', 19, '11:35'),
  ('fr-080', 'Morenada San Cristóbal', null, 2, 'folklorica', 29, 'checkpoint', 20, '11:50'),
  ('fr-081', 'Llamarada Antofagasta', null, 2, 'folklorica', 29, 'checkpoint', 21, '12:05'),
  ('fr-082', 'Pujllay 31 de Octubre', null, 2, 'folklorica', 29, 'checkpoint', 22, '12:20'),
  ('fr-083', 'Suris Bancario', null, 2, 'folklorica', 29, 'checkpoint', 23, '12:30'),
  ('fr-084', 'Pujllay S.E.P.S.A.', null, 2, 'folklorica', 29, 'checkpoint', 24, '12:45'),
  ('fr-085', 'Caporales Cervecería Nacional Potosí', null, 2, 'folklorica', 29, 'checkpoint', 25, '13:00'),
  ('fr-086', 'Llamarada María Auxiliadora', null, 3, 'folklorica', 29, 'checkpoint', 26, '13:10'),
  ('fr-087', 'Cullaguada San Martín', null, 3, 'folklorica', 29, 'checkpoint', 27, '13:20'),
  ('fr-088', 'Zambos Medicina', null, 3, 'folklorica', 29, 'checkpoint', 28, '13:30'),
  ('fr-089', 'Diablada Bamin', null, 3, 'folklorica', 29, 'checkpoint', 29, '13:45'),
  ('fr-090', 'Morenada Central Potosí', null, 3, 'folklorica', 29, 'checkpoint', 30, '14:00'),
  ('fr-091', 'Caporales Ingeniería Civil', null, 3, 'folklorica', 29, 'checkpoint', 31, '14:15'),
  ('fr-092', 'Saya Afro Boliviana Artes UATF', null, 3, 'folklorica', 29, 'checkpoint', 32, '14:25'),
  ('fr-093', 'Tobas Juan Manuel Calero', null, 3, 'folklorica', 29, 'checkpoint', 33, '14:25'),
  ('fr-094', 'Caporales Domingo Savio', null, 3, 'folklorica', 29, 'checkpoint', 34, '14:50'),
  ('fr-095', 'Morenada Auténtica Central Potosí', null, 3, 'folklorica', 29, 'checkpoint', 35, '15:05'),
  ('fr-096', 'Diablada Santa Lucía', null, 3, 'folklorica', 29, 'checkpoint', 36, '15:20'),
  ('fr-097', 'Salay Bolivia', null, 3, 'folklorica', 29, 'checkpoint', 37, '15:35'),
  ('fr-098', 'Caporales Fieras del Gran Potosí', null, 4, 'folklorica', 29, 'checkpoint', 38, '15:45'),
  ('fr-099', 'Cullaguada Maypes Trabajo Social', null, 4, 'folklorica', 29, 'checkpoint', 39, '15:55'),
  ('fr-100', 'Morenada 100% Intocables La Nueva Elegancia en Potosí', null, 4, 'folklorica', 29, 'checkpoint', 40, '16:05'),
  ('fr-101', 'Tobas Ingeniería Informática', null, 4, 'folklorica', 29, 'checkpoint', 41, '16:20'),
  ('fr-102', 'Pujllay Derecho', null, 4, 'folklorica', 29, 'checkpoint', 42, '16:30'),
  ('fr-103', 'Caporales San Simón', null, 4, 'folklorica', 29, 'checkpoint', 43, '16:40'),
  ('fr-104', '100% Salay Potosí', null, 4, 'folklorica', 29, 'checkpoint', 44, '16:50'),
  ('fr-105', 'Morenada Fanáticos', null, 4, 'folklorica', 29, 'checkpoint', 45, '17:00'),
  ('fr-106', 'Saya Afro Boliviana Mocafri', null, 4, 'folklorica', 29, 'checkpoint', 46, '17:15'),
  ('fr-107', 'Diablada LIED Tradicional', null, 4, 'folklorica', 29, 'checkpoint', 47, '17:25'),
  ('fr-108', 'Salay Tukuypaj', null, 4, 'folklorica', 29, 'checkpoint', 48, '17:35'),
  ('fr-109', 'Pujllay Economía', null, 4, 'folklorica', 29, 'checkpoint', 49, '17:45'),
  ('fr-110', 'Salay Cochabamba', null, 5, 'folklorica', 29, 'checkpoint', 50, '17:55'),
  ('fr-111', 'Negritos de la Torre', null, 5, 'folklorica', 29, 'checkpoint', 51, '18:05'),
  ('fr-112', 'Llamarada Agroindustrial', null, 5, 'folklorica', 29, 'checkpoint', 52, '18:15'),
  ('fr-113', 'Salay Expresión Boliviana', null, 5, 'folklorica', 29, 'checkpoint', 53, '18:25'),
  ('fr-114', 'Saya Afro Boliviana Ingeniería Ambiental', null, 5, 'folklorica', 29, 'checkpoint', 54, '18:35'),
  ('fr-115', 'Negritos Ingeniería de Sistemas', null, 5, 'folklorica', 29, 'checkpoint', 55, '18:45'),
  ('fr-116', 'Zapateo Pandilla Nueva Generación', null, 5, 'folklorica', 29, 'checkpoint', 56, '19:00'),
  ('fr-117', 'La Cacharpaya', 'Comunidad de San Antonio · Municipio de Yocalla', null, 'autoctona', 30, 'checkpoint', 1, '10:00'),
  ('fr-118', 'Pascananitan', 'Asamblea Legislativa Departamental de Potosí', null, 'autoctona', 30, 'checkpoint', 2, '10:10'),
  ('fr-119', 'Carnaval de Antaño', 'Secretaría Departamental de Turismo y Cultura', null, 'autoctona', 30, 'checkpoint', 3, '10:20'),
  ('fr-120', 'Cajanis', 'Municipio de Tahua', null, 'autoctona', 30, 'checkpoint', 4, '10:30'),
  ('fr-121', 'Sicuriada', 'Gobierno Autónomo Departamental de Potosí', null, 'autoctona', 30, 'checkpoint', 5, '10:40'),
  ('fr-122', 'Anatas', 'Municipio de Tahua', null, 'autoctona', 30, 'checkpoint', 6, '10:50'),
  ('fr-123', 'Erkenchada', 'Comunidad de Lampaya · Municipio de Villazón', null, 'autoctona', 30, 'checkpoint', 7, '11:00'),
  ('fr-124', 'Carnaval Carmeño', 'Comunidad de San Miguel · Municipio de Porco', null, 'autoctona', 30, 'checkpoint', 8, '11:10'),
  ('fr-125', 'Carnaval Blanco', 'Municipio de Tomave', null, 'autoctona', 30, 'checkpoint', 9, '11:20'),
  ('fr-126', 'Carnaval Chumpi', 'Municipio de Tomave', null, 'autoctona', 30, 'checkpoint', 10, '11:30'),
  ('fr-127', 'Carnaval Blanco', 'Carlos Machicado · Municipio de Tomave', null, 'autoctona', 30, 'checkpoint', 11, '11:40'),
  ('fr-128', 'Pali Pali', 'Comunidad Originaria de Cocani · Municipio de Colcha K', null, 'autoctona', 30, 'checkpoint', 12, '11:50'),
  ('fr-129', 'Karapayas', 'Comunidad de Tarapaya · Municipio de Potosí', null, 'autoctona', 30, 'checkpoint', 13, '12:00'),
  ('fr-130', 'Carnaval Cotagaiteño', 'Municipio de Cotagaita', null, 'autoctona', 30, 'checkpoint', 14, '12:10'),
  ('fr-131', 'Turuchipeños', 'Comunidad de Turuchipa · Municipio de Ckochas', null, 'autoctona', 30, 'checkpoint', 15, '12:20'),
  ('fr-132', 'Qhonqhota', 'SEDES', null, 'autoctona', 30, 'checkpoint', 16, '12:30'),
  ('fr-133', 'Tupiceños', 'Centro Cultural Quebradeños', null, 'autoctona', 30, 'checkpoint', 17, '12:40'),
  ('fr-134', 'Carnaval Aripalqueño', 'SEDEGES', null, 'autoctona', 30, 'checkpoint', 18, '12:50'),
  ('fr-135', 'Salaque', 'Municipio de Colquechaca', null, 'autoctona', 30, 'checkpoint', 19, '13:00'),
  ('fr-136', 'Sicuriada', 'Municipio de Atocha', null, 'autoctona', 30, 'checkpoint', 20, '13:10'),
  ('fr-137', 'Sampoñaris', 'Municipio de Vitichi', null, 'autoctona', 30, 'checkpoint', 21, '13:20'),
  ('fr-138', 'Fandango', 'SEDCOHI · Municipio de Ckochas', null, 'autoctona', 30, 'checkpoint', 22, '13:30'),
  ('fr-139', 'Carnaval Yureño', 'Gobierno Autónomo Indígena Originario Campesino del Jatun Ayllu Yura', null, 'autoctona', 30, 'checkpoint', 23, '13:40'),
  ('fr-140', 'Conjunto Carnaval Blanco', 'Comunidad de Villa Esperanza · Municipio de Uyuni', null, 'autoctona', 30, 'checkpoint', 24, '13:50'),
  ('fr-141', 'Anata Carnaval Lipeño', 'Municipio de Llica', null, 'autoctona', 30, 'checkpoint', 25, '14:00'),
  ('fr-142', 'Burro Qhati', 'Gobierno Autónomo Departamental de Potosí', null, 'autoctona', 30, 'checkpoint', 26, '14:10'),
  ('fr-143', 'Chililin', 'Municipio de Caiza "D"', null, 'autoctona', 30, 'checkpoint', 27, '14:20'),
  ('fr-144', 'El Matrimonio', 'Municipio de Llallagua', null, 'autoctona', 30, 'checkpoint', 28, '14:30'),
  ('fr-145', 'Sicuriada', 'Municipio de Llallagua', null, 'autoctona', 30, 'checkpoint', 29, '14:40'),
  ('fr-146', 'Jula Jula', 'Municipio de Pocoata', null, 'autoctona', 30, 'checkpoint', 30, '14:50'),
  ('fr-147', 'Los Viejos de Rodero', 'Municipio de Chaquí', null, 'autoctona', 30, 'checkpoint', 31, '15:00'),
  ('fr-148', 'Niño de la Virgen de Guadalupe', 'Col. Nal. Chaquí · Municipio de Chaquí', null, 'autoctona', 30, 'checkpoint', 32, '15:10'),
  ('fr-149', 'Fiesta de Aylantu', 'Comunidad de Yascapi · Municipio de Puna', null, 'autoctona', 30, 'checkpoint', 33, '15:20'),
  ('fr-150', 'Jula Jula', 'Comunidad de Cantumarca · Municipio de Potosí', null, 'autoctona', 30, 'checkpoint', 34, '15:30'),
  ('fr-151', 'Pandilla de Condes', 'Municipio de Tacobamba', null, 'autoctona', 30, 'checkpoint', 35, '15:40'),
  ('fr-152', 'Pascua / Caja Rueda', 'U.E. Alberto Maisano · Comunidad de Ñuqui · Municipio de Puna', null, 'autoctona', 30, 'checkpoint', 36, '15:50'),
  ('fr-153', 'Pinkillada', 'Municipio de Tinguipaya', null, 'autoctona', 30, 'checkpoint', 37, '16:00'),
  ('fr-154', 'Carnavalito', 'Municipio de Yocalla', null, 'autoctona', 30, 'checkpoint', 38, '16:10'),
  ('fr-155', 'Jaylliris', 'Comunidad de Suquicha · Municipio de Puna', null, 'autoctona', 30, 'checkpoint', 39, '16:20'),
  ('fr-156', 'Jula Jula', 'Comunidad de Puyuj Pata · Ayllu Kollana Inaire · Municipio de Tinguipaya', null, 'autoctona', 30, 'checkpoint', 40, '16:30'),
  ('fr-157', 'Carnaval Tingueño', 'Municipio de Tinguipaya', null, 'autoctona', 30, 'checkpoint', 41, '16:40'),
  ('fr-158', 'Carnaval Coromeño', 'Comunidad de Coroma · Municipio de Uyuni', null, 'autoctona', 30, 'checkpoint', 42, '16:50'),
  ('fr-159', 'Suri Sikus', 'Comunidad de Wila Qullu · Municipio de Potosí', null, 'autoctona', 30, 'checkpoint', 43, '17:00'),
  ('fr-160', 'Wititis', 'Centro Cultural Supay Marka', null, 'autoctona', 30, 'checkpoint', 44, '17:10'),
  ('fr-161', 'Saltarín', 'Ballet Cima de Plata', null, 'autoctona', 30, 'checkpoint', 45, '17:20'),
  ('fr-162', 'Tinkuy', 'Municipio de San Pedro de Macha', null, 'autoctona', 30, 'checkpoint', 46, '17:30'),
  ('fr-163', 'Tinkuy', 'Fraternidad Cultural Tinkuy Tolckas Huachacalla', null, 'autoctona', 30, 'checkpoint', 47, '17:40')
on conflict (id) do update set
  nombre        = excluded.nombre,
  entidad       = excluded.entidad,
  grupo         = excluded.grupo,
  tipo          = excluded.tipo,
  dia           = excluded.dia,
  modo_tracking = excluded.modo_tracking,
  orden_ingreso = excluded.orden_ingreso,
  hora_estimada = excluded.hora_estimada;

commit;

-- Verificacion:
--   select dia, count(*) from fraternidades group by dia order by dia;
--   -> 28 | 60
--   -> 29 | 56
--   -> 30 | 47
