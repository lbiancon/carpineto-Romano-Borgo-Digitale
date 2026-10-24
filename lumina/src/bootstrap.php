<?php

declare(strict_types=1);

define('LUMINA_ROOT', dirname(__DIR__));

date_default_timezone_set('UTC');

require LUMINA_ROOT . '/src/helpers.php';

spl_autoload_register(static function (string $class): void {
    $prefix = 'Lumina\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = LUMINA_ROOT . '/src/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});
