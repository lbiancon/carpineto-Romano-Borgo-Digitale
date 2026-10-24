<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title><?= e($title) ?> · <?= e($business['name']) ?></title>
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/app.css">
</head>
<body>
  <a class="skip" href="#contenuto">Vai al contenuto</a>
  <div class="shell">
    <aside class="sidebar">
      <a class="wordmark" href="/app"><span class="mark" aria-hidden="true"></span> Lumina</a>
      <p class="biz"><?= e($business['name']) ?></p>
      <nav class="side-nav">
        <a class="<?= path_is('/app') ? 'active' : '' ?>" href="/app">Oggi</a>
        <a class="<?= path_is('/app/giornata') ? 'active' : '' ?>" href="/app/giornata">Bacheca</a>
        <a class="<?= path_is('/app/agenda') ? 'active' : '' ?>" href="/app/agenda">Settimana</a>
        <a class="<?= path_is('/app/clienti') ? 'active' : '' ?>" href="/app/clienti">Clienti</a>
        <a class="<?= path_is('/app/classi') ? 'active' : '' ?>" href="/app/classi">Corsi</a>
        <a class="<?= path_is('/app/attesa') ? 'active' : '' ?>" href="/app/attesa">Attesa</a>
        <a class="<?= path_is('/app/analisi') ? 'active' : '' ?>" href="/app/analisi">Analisi</a>
        <?php if (!empty($owner)): ?>
          <a class="<?= path_is('/app/servizi') ? 'active' : '' ?>" href="/app/servizi">Servizi</a>
          <a class="<?= path_is('/app/staff') ? 'active' : '' ?>" href="/app/staff">Persone</a>
          <a class="<?= path_is('/app/prezzi') ? 'active' : '' ?>" href="/app/prezzi">Prezzo vivo</a>
          <a class="<?= path_is('/app/pacchetti') ? 'active' : '' ?>" href="/app/pacchetti">Tessere</a>
          <a class="<?= path_is('/app/impostazioni') ? 'active' : '' ?>" href="/app/impostazioni">Impostazioni</a>
        <?php endif; ?>
      </nav>
      <a href="/b/<?= e($business['slug']) ?>">Pagina pubblica</a>
    </aside>
    <div class="workspace" id="contenuto">
      <header class="topbar">
        <div>
          <p class="kicker"><?= e(category_label((string) $business['category'])) ?></p>
          <h1><?= e($title) ?></h1>
        </div>
        <div class="actions">
          <a class="bell" href="/app/notifiche">Notifiche <?php if (($unread ?? 0) > 0): ?><strong><?= (int) $unread ?></strong><?php endif; ?></a>
          <span><?= e($user['name']) ?></span>
          <form method="post" action="/esci"><?= csrf_field() ?><button class="btn small ghost" type="submit">Esci</button></form>
        </div>
      </header>
      <?php if ($flash = pull_flash()): ?><div class="flash <?= e($flash['type']) ?>"><?= e($flash['text']) ?></div><?php endif; ?>
      <?= $content ?>
    </div>
  </div>
  <script src="/assets/app.js"></script>
</body>
</html>
