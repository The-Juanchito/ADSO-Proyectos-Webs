<?php
// Exporta TODA tu base SQL Server actual a un archivo JSON (migracion/datos.json).
// Uso (desde la carpeta del proyecto ANTIGUO, donde está api/lib/db.php):
//   C:\xampp\php\php.exe -c api\conf\php.ini migracion\exportar.php
// Copia este archivo a esa carpeta antes de ejecutarlo.
declare(strict_types=1);
require __DIR__ . '/../api/lib/db.php';

$tablas = [
  'categorias','usuarios','productos','imagenes_producto','producto_colores','producto_tallas',
  'resenas','carrito','detalle_carrito','direcciones','pedidos','detalle_pedido','pagos',
  'notificaciones','vistas','mensajes','anuncios',
];
$pdo = db();
$salida = [];
foreach ($tablas as $t) {
  try {
    $salida[$t] = $pdo->query("SELECT * FROM $t")->fetchAll(PDO::FETCH_ASSOC);
    echo str_pad($t, 20) . count($salida[$t]) . " filas\n";
  } catch (Throwable $e) {
    echo str_pad($t, 20) . "(no existe, se omite)\n";
  }
}
file_put_contents(__DIR__ . '/datos.json', json_encode($salida, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR));
echo "\nListo: migracion/datos.json\n";
