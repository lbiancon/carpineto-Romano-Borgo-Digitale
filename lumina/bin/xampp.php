<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

use Lumina\Db;

if (PHP_OS_FAMILY !== 'Windows') {
    echo 'PHP ' . PHP_VERSION . " è aggiornato.\n";
    echo "bin/xampp.php prepara Apache e MariaDB di XAMPP su Windows. Qui usa php bin/setup.sh e php bin/serve.sh.\n";
    exit(0);
}

$xampp = lumina_xampp_root();
if ($xampp === null) {
    fwrite(STDERR, "Non trovo la cartella di XAMPP accanto a questo PHP.\n");
    fwrite(STDERR, "Imposta XAMPP_HOME sulla cartella già installata e rilancia. Non reinstallare sopra htdocs.\n");
    exit(1);
}

$httpd = $xampp . '\\apache\\conf\\httpd.conf';
if (!is_file($httpd)) {
    fwrite(STDERR, "Manca {$httpd}. L'installazione di XAMPP non è completa.\n");
    exit(1);
}

$public = str_replace('\\', '/', dirname(__DIR__) . '/public');
$extraDir = $xampp . '\\apache\\conf\\extra';
$extra = $extraDir . '\\httpd-lumina.conf';
if (!is_dir($extraDir) && !mkdir($extraDir, 0777, true) && !is_dir($extraDir)) {
    fwrite(STDERR, "Non riesco a creare {$extraDir}.\n");
    exit(1);
}

$listen = lumina_xampp_listens($xampp, $httpd);
$conf = "<VirtualHost *:8080>\r\n"
    . "    ServerName localhost\r\n"
    . '    DocumentRoot "' . $public . "\"\r\n"
    . '    <Directory "' . $public . "\">\r\n"
    . "        Options -Indexes +FollowSymLinks\r\n"
    . "        AllowOverride All\r\n"
    . "        Require local\r\n"
    . "        DirectoryIndex index.php\r\n"
    . "    </Directory>\r\n"
    . "    ErrorLog \"logs/lumina-error.log\"\r\n"
    . "    CustomLog \"logs/lumina-access.log\" common\r\n"
    . "</VirtualHost>\r\n";
if (!$listen) {
    $conf = "Listen 8080\r\n" . $conf;
}
file_put_contents($extra, $conf);
lumina_xampp_patch_httpd($httpd);
lumina_xampp_database();

putenv('LUMINA_DB_HOST=127.0.0.1');
putenv('LUMINA_DB_PORT=3306');
putenv('LUMINA_DB_NAME=lumina');
putenv('LUMINA_DB_USER=lumina');
putenv('LUMINA_DB_PASS=lumina_local');

echo "Apache di XAMPP serve Lumina su http://127.0.0.1:8080\n";
echo "Riavvia Apache dal pannello XAMPP. La porta 80 del pannello resta com'era.\n";
echo "Require local: la pagina risponde solo da questo PC.\n";

require __DIR__ . '/seed.php';

function lumina_xampp_root(): ?string
{
    $fromEnv = getenv('XAMPP_HOME');
    if (is_string($fromEnv) && is_file(rtrim($fromEnv, '\\/') . '\\apache\\conf\\httpd.conf')) {
        return rtrim($fromEnv, '\\/');
    }
    if (preg_match('/^(.*)[\\\\\\/]php[\\\\\\/]php\.exe$/i', PHP_BINARY, $match) === 1) {
        return $match[1];
    }

    return null;
}

function lumina_xampp_listens(string $xampp, string $httpd): bool
{
    $chunks = [(string) file_get_contents($httpd)];
    foreach (glob($xampp . '\\apache\\conf\\extra\\*.conf') ?: [] as $file) {
        if (basename($file) === 'httpd-lumina.conf') {
            continue;
        }
        $chunks[] = (string) file_get_contents($file);
    }

    return preg_match('/^\s*Listen\s+8080\b/m', implode("\n", $chunks)) === 1;
}

function lumina_xampp_patch_httpd(string $httpd): void
{
    $original = (string) file_get_contents($httpd);
    $next = preg_replace('/^#\s*(LoadModule rewrite_module modules\/mod_rewrite\.so)\s*$/m', '$1', $original, 1) ?? $original;
    if (!str_contains($next, 'httpd-lumina.conf')) {
        $next = rtrim($next) . "\r\nInclude conf/extra/httpd-lumina.conf\r\n";
    }
    if ($next === $original) {
        return;
    }
    $backup = $httpd . '.lumina-bak';
    if (!is_file($backup)) {
        copy($httpd, $backup);
    }
    file_put_contents($httpd, $next);
}

function lumina_xampp_database(): void
{
    $password = getenv('XAMPP_MYSQL_ROOT_PASSWORD');
    $password = is_string($password) ? $password : '';
    $pdo = null;
    $last = null;
    foreach (['127.0.0.1', 'localhost'] as $host) {
        try {
            $pdo = new PDO("mysql:host={$host};port=3306;charset=utf8mb4", 'root', $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
            break;
        } catch (PDOException $exception) {
            $last = $exception;
        }
    }
    if (!$pdo instanceof PDO) {
        fwrite(STDERR, "MariaDB di XAMPP non risponde. Avvialo dal pannello e rilancia bin\\xampp.bat\n");
        if ($last instanceof PDOException) {
            fwrite(STDERR, $last->getMessage() . "\n");
        }
        exit(1);
    }
    $pdo->exec('CREATE DATABASE IF NOT EXISTS lumina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS lumina_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    foreach (['127.0.0.1', 'localhost'] as $host) {
        $pdo->exec("CREATE USER IF NOT EXISTS 'lumina'@'{$host}' IDENTIFIED BY 'lumina_local'");
        $pdo->exec("ALTER USER 'lumina'@'{$host}' IDENTIFIED BY 'lumina_local'");
        $pdo->exec("GRANT ALL PRIVILEGES ON lumina.* TO 'lumina'@'{$host}'");
        $pdo->exec("GRANT ALL PRIVILEGES ON lumina_test.* TO 'lumina'@'{$host}'");
    }
    $pdo->exec('FLUSH PRIVILEGES');
    Db::connect();
}
