select * from usuarios;
-- =====================================================
-- MAXISTORE - BASE DE DATOS COMPLETA
-- MySQL / XAMPP
-- =====================================================

CREATE DATABASE IF NOT EXISTS maxistore
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE maxistore;

-- =====================================================
-- 1. USUARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) DEFAULT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(25) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    estado ENUM('activo', 'inactivo', 'bloqueado')
        NOT NULL DEFAULT 'activo',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 2. CATEGORIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT DEFAULT NULL,
    imagen VARCHAR(255) DEFAULT NULL,
    estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 3. PRODUCTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT UNSIGNED DEFAULT NULL,
    nombre VARCHAR(180) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    precio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    imagen VARCHAR(255) DEFAULT NULL,
    estado ENUM('activo', 'inactivo', 'agotado')
        NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_productos_nombre (nombre),
    INDEX idx_productos_categoria (categoria_id),
    INDEX idx_productos_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- 4. DIRECCIONES DE LOS CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS direcciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    nombre_destinatario VARCHAR(150) NOT NULL,
    telefono VARCHAR(25) DEFAULT NULL,
    departamento VARCHAR(100) DEFAULT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    complemento VARCHAR(255) DEFAULT NULL,
    codigo_postal VARCHAR(20) DEFAULT NULL,
    principal TINYINT(1) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_direcciones_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_direcciones_usuario (usuario_id)
) ENGINE=InnoDB;

-- =====================================================
-- 5. CARRITOS
-- =====================================================

CREATE TABLE IF NOT EXISTS carritos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_carritos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 6. DETALLES DEL CARRITO
-- =====================================================

CREATE TABLE IF NOT EXISTS carrito_detalles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    carrito_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_carrito_producto
        UNIQUE (carrito_id, producto_id),

    CONSTRAINT fk_carrito_detalles_carrito
        FOREIGN KEY (carrito_id)
        REFERENCES carritos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_carrito_detalles_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 7. PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS pedidos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    direccion_id INT UNSIGNED DEFAULT NULL,
    numero_pedido VARCHAR(40) NOT NULL UNIQUE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    costo_envio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    estado ENUM(
        'pendiente',
        'confirmado',
        'preparando',
        'enviado',
        'entregado',
        'cancelado'
    ) NOT NULL DEFAULT 'pendiente',

    nombre_destinatario VARCHAR(150) DEFAULT NULL,
    telefono_entrega VARCHAR(25) DEFAULT NULL,
    direccion_entrega VARCHAR(255) DEFAULT NULL,
    ciudad_entrega VARCHAR(100) DEFAULT NULL,
    notas TEXT DEFAULT NULL,

    fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_pedidos_direccion
        FOREIGN KEY (direccion_id)
        REFERENCES direcciones(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_estado (estado),
    INDEX idx_pedidos_fecha (fecha_pedido)
) ENGINE=InnoDB;

-- =====================================================
-- 8. DETALLE DE CADA PEDIDO
-- =====================================================

CREATE TABLE IF NOT EXISTS detalle_pedido (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED DEFAULT NULL,
    nombre_producto VARCHAR(180) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_detalle_pedido_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_pedido_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_detalle_pedido_pedido (pedido_id)
) ENGINE=InnoDB;

-- =====================================================
-- 9. PAGOS
-- =====================================================

CREATE TABLE IF NOT EXISTS pagos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT UNSIGNED NOT NULL,
    referencia VARCHAR(100) DEFAULT NULL,
    metodo_pago ENUM(
        'contraentrega',
        'transferencia',
        'tarjeta',
        'otro'
    ) NOT NULL DEFAULT 'contraentrega',

    monto DECIMAL(12,2) NOT NULL,
    estado ENUM(
        'pendiente',
        'aprobado',
        'rechazado',
        'reembolsado'
    ) NOT NULL DEFAULT 'pendiente',

    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_pagos_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_pagos_pedido (pedido_id),
    INDEX idx_pagos_estado (estado)
) ENGINE=InnoDB;

-- =====================================================
-- 10. RESENAS DE PRODUCTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS resenas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,
    calificacion TINYINT UNSIGNED NOT NULL,
    comentario TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_resena_usuario_producto
        UNIQUE (usuario_id, producto_id),

    CONSTRAINT fk_resenas_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_resenas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_resenas_producto (producto_id)
) ENGINE=InnoDB;

-- =====================================================
-- 11. CATEGORIAS INICIALES
-- =====================================================

INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
('Tecnología', 'Productos tecnológicos y electrónicos'),
('Hogar', 'Artículos para el hogar'),
('Ropa', 'Prendas de vestir y accesorios'),
('Accesorios', 'Accesorios para diferentes necesidades'),
('Otros', 'Productos de otras categorías');

-- =====================================================
-- FIN DE LA BASE DE DATOS
-- =====================================================
