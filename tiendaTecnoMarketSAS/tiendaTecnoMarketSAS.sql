CREATE DATABASE tiendaTecnoMarketSAS;
USE tiendaTecnoMarketSAS;

CREATE TABLE producto (
    codigo INT PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion VARCHAR(255),
    cantidad INT,
    valor DECIMAL(10,2),
    imagen VARCHAR(255)
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150),
    usuario VARCHAR(50) UNIQUE,
    contraseña VARCHAR(255),
    rol VARCHAR(50)
);

