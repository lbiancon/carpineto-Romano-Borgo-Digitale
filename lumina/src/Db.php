<?php

declare(strict_types=1);

namespace Lumina;

use PDO;
use PDOStatement;

final class Db
{
    public static function connect(?string $name = null): PDO
    {
        $database = $name ?? (getenv('LUMINA_DB_NAME') ?: 'lumina');
        $host = getenv('LUMINA_DB_HOST') ?: '127.0.0.1';
        $port = getenv('LUMINA_DB_PORT') ?: '3306';
        $user = getenv('LUMINA_DB_USER') ?: 'lumina';
        $pass = getenv('LUMINA_DB_PASS') ?: 'lumina_local';
        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");

        return $pdo;
    }

    public static function run(PDO $pdo, string $sql, array $params = []): PDOStatement
    {
        $statement = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $name = is_int($key) ? $key + 1 : (str_starts_with((string) $key, ':') ? (string) $key : ':' . $key);
            $type = match (true) {
                is_int($value) => PDO::PARAM_INT,
                $value === null => PDO::PARAM_NULL,
                default => PDO::PARAM_STR,
            };
            $statement->bindValue($name, $value, $type);
        }
        $statement->execute();

        return $statement;
    }

    public static function all(PDO $pdo, string $sql, array $params = []): array
    {
        return self::run($pdo, $sql, $params)->fetchAll();
    }

    public static function one(PDO $pdo, string $sql, array $params = []): ?array
    {
        $row = self::run($pdo, $sql, $params)->fetch();

        return $row === false ? null : $row;
    }

    public static function value(PDO $pdo, string $sql, array $params = []): mixed
    {
        $value = self::run($pdo, $sql, $params)->fetchColumn();

        return $value === false ? null : $value;
    }

    public static function id(PDO $pdo): int
    {
        return (int) $pdo->lastInsertId();
    }

    public static function duplicate(PDOException $exception): bool
    {
        return (string) $exception->getCode() === '23000';
    }
}
