-- =====================================================
-- SCHEMA NORMALIZADO — Gestión Académica
-- Ejecuta este archivo en MySQL Workbench
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS gestion_academica
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gestion_academica;

-- Eliminar tablas en orden inverso a FK
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS actividades;
DROP TABLE IF EXISTS horario_secciones;
DROP TABLE IF EXISTS secciones;
DROP TABLE IF EXISTS competencias_curso;
DROP TABLE IF EXISTS cursos;
DROP TABLE IF EXISTS alumnos;
DROP TABLE IF EXISTS salones;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS referencia_dias;
DROP TABLE IF EXISTS referencia_franjas;

-- Tablas antiguas (por si se ejecuta sobre la versión anterior)
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS section_schedule;
DROP TABLE IF EXISTS section_competencias;
DROP TABLE IF EXISTS section_schedule_times;
DROP TABLE IF EXISTS section_schedule_days;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS course_competencias;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classrooms;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schedule_reference_days;
DROP TABLE IF EXISTS schedule_reference_time_slots;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. SALONES
--    Entidad que representa un grupo (ej: 3° A)
-- =====================================================
CREATE TABLE salones (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  grado VARCHAR(20) NOT NULL,
  letra VARCHAR(10) NOT NULL,
  UNIQUE KEY uq_salon (grado, letra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. USUARIOS
--    Va antes de cursos porque cursos referencia usuarios
-- =====================================================
CREATE TABLE usuarios (
  id               VARCHAR(100) PRIMARY KEY,
  usuario          VARCHAR(100) DEFAULT NULL,
  nombre_display   VARCHAR(255) DEFAULT NULL,
  correo           VARCHAR(255) DEFAULT NULL,
  contrasena       VARCHAR(255) DEFAULT NULL,
  rol              VARCHAR(20)  DEFAULT 'docente',
  activo           TINYINT(1)   DEFAULT 1,
  intentos_fallidos INT         DEFAULT 0,
  bloqueado_hasta  BIGINT       DEFAULT NULL,
  creado_en        BIGINT       DEFAULT NULL,
  foto             LONGTEXT     DEFAULT NULL,
  UNIQUE KEY uq_usuario (usuario),
  UNIQUE KEY uq_correo  (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CURSOS
--    id_usuario: docente propietario del curso
-- =====================================================
CREATE TABLE cursos (
  id         VARCHAR(100) PRIMARY KEY,
  nombre     VARCHAR(255) NOT NULL,
  color      VARCHAR(20)  DEFAULT NULL,
  id_usuario VARCHAR(100) DEFAULT NULL,
  creado_en  BIGINT       DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_curso_usuario (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. COMPETENCIAS DEL CURSO
--    Única fuente de verdad de competencias
-- =====================================================
CREATE TABLE competencias_curso (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  id_curso VARCHAR(100) NOT NULL,
  bimestre INT          NOT NULL,
  posicion INT          NOT NULL,
  texto    TEXT         NOT NULL,
  FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
  INDEX idx_comp_curso     (id_curso),
  INDEX idx_comp_curso_bim (id_curso, bimestre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. SECCIONES
--    id_salon reemplaza grado + letra (3NF)
-- =====================================================
CREATE TABLE secciones (
  id           VARCHAR(100) PRIMARY KEY,
  id_curso     VARCHAR(100) NOT NULL,
  id_salon     INT          NOT NULL,
  creado_en    BIGINT       DEFAULT NULL,
  competencias TEXT         DEFAULT NULL COMMENT 'JSON: competencias seleccionadas por bimestre',
  FOREIGN KEY (id_curso) REFERENCES cursos(id)   ON DELETE CASCADE,
  FOREIGN KEY (id_salon) REFERENCES salones(id)  ON DELETE CASCADE,
  INDEX idx_sec_curso (id_curso),
  INDEX idx_sec_salon (id_salon)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. HORARIO DE SECCIONES
--    Una franja horaria por día por sección
-- =====================================================
CREATE TABLE horario_secciones (
  id_seccion  VARCHAR(100) NOT NULL,
  dia         VARCHAR(30)  NOT NULL,
  hora_inicio VARCHAR(10)  DEFAULT NULL,
  hora_fin    VARCHAR(10)  DEFAULT NULL,
  posicion    INT          DEFAULT 0,
  PRIMARY KEY (id_seccion, dia),
  FOREIGN KEY (id_seccion) REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ALUMNOS
--    id_salon reemplaza grado + letra (3NF)
-- =====================================================
CREATE TABLE alumnos (
  id          VARCHAR(100) PRIMARY KEY,
  id_salon    INT          NOT NULL,
  id_usuario  VARCHAR(100) DEFAULT NULL,
  nombre      VARCHAR(255) NOT NULL,
  observacion TEXT         DEFAULT NULL,
  retirado    TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (id_salon)   REFERENCES salones(id)  ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_alu_salon    (id_salon),
  INDEX idx_alu_usuario  (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. ACTIVIDADES
--    Sin id_curso (transitivo via id_seccion → secciones)
--    id_competencia FK real a competencias_curso
-- =====================================================
CREATE TABLE actividades (
  id             VARCHAR(100) PRIMARY KEY,
  id_seccion     VARCHAR(100) NOT NULL,
  nombre         VARCHAR(255) NOT NULL,
  bimestre       INT          DEFAULT NULL,
  id_competencia INT          DEFAULT NULL,
  tipo           VARCHAR(50)  DEFAULT NULL,
  fecha_entrega  VARCHAR(20)  DEFAULT NULL,
  peso           VARCHAR(20)  DEFAULT NULL,
  FOREIGN KEY (id_seccion)     REFERENCES secciones(id)         ON DELETE CASCADE,
  FOREIGN KEY (id_competencia) REFERENCES competencias_curso(id) ON DELETE SET NULL,
  INDEX idx_act_seccion (id_seccion),
  INDEX idx_act_comp    (id_competencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. NOTAS
--    Sin id_curso ni id_seccion (transitivos via id_actividad)
-- =====================================================
CREATE TABLE notas (
  id_alumno    VARCHAR(100) NOT NULL,
  id_actividad VARCHAR(100) NOT NULL,
  nota         VARCHAR(5)   DEFAULT NULL,
  PRIMARY KEY (id_alumno, id_actividad),
  FOREIGN KEY (id_alumno)    REFERENCES alumnos(id)     ON DELETE CASCADE,
  FOREIGN KEY (id_actividad) REFERENCES actividades(id) ON DELETE CASCADE,
  INDEX idx_nota_actividad (id_actividad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. REFERENCIA DE HORARIOS
-- =====================================================
CREATE TABLE referencia_dias (
  dia      VARCHAR(30) PRIMARY KEY,
  posicion INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- franja VARCHAR(20) para cubrir formatos como "07:00-08:00"
CREATE TABLE referencia_franjas (
  franja   VARCHAR(20) PRIMARY KEY,
  posicion INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED: Usuario administrador por defecto
-- Credenciales: usuario=admin / contraseña=admin123
-- La contraseña se hashea automáticamente en el primer login
-- =====================================================
INSERT INTO usuarios (id, usuario, nombre_display, correo, contrasena, rol, activo, creado_en)
VALUES (
  'admin_default',
  'admin',
  'Administrador',
  'admin@sistema.edu',
  '$2b$12$rTBd/vEtj0JGrkeJLl8tvuaX0uv22YFas1sq6mu.knaK.72uWt2Fy',
  'admin',
  1,
  UNIX_TIMESTAMP() * 1000
);
INSERT INTO referencia_dias (dia, posicion) VALUES
  ('Lunes',     0),
  ('Martes',    1),
  ('Miércoles', 2),
  ('Jueves',    3),
  ('Viernes',   4);

-- =====================================================
-- SEED: Franjas horarias de referencia (30 min)
-- =====================================================
INSERT INTO referencia_franjas (franja, posicion) VALUES
  ('07:00',  0), ('07:30',  1),
  ('08:00',  2), ('08:30',  3),
  ('09:00',  4), ('09:30',  5),
  ('10:00',  6), ('10:30',  7),
  ('11:00',  8), ('11:30',  9),
  ('12:00', 10), ('12:30', 11),
  ('13:00', 12), ('13:30', 13),
  ('14:00', 14), ('14:30', 15),
  ('15:00', 16), ('15:30', 17),
  ('16:00', 18), ('16:30', 19),
  ('17:00', 20), ('17:30', 21),
  ('18:00', 22), ('18:30', 23),
  ('19:00', 24), ('19:30', 25),
  ('20:00', 26), ('20:30', 27),
  ('21:00', 28), ('21:30', 29),
  ('22:00', 30);