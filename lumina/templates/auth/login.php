<section class="auth">
  <form class="card" method="post" action="/accedi">
    <?= csrf_field() ?>
    <?= redirect_field('/app') ?>
    <h1>Accedi</h1>
    <label class="field">Email <input type="email" name="email" required autocomplete="username" value="<?= e(field('email')) ?>"></label>
    <label class="field">Password <input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn" type="submit">Entra</button>
  </form>
  <?php if (!empty($demo)): ?>
    <aside class="card">
      <p class="kicker">Demo</p>
      <h2>Due attività già vive</h2>
      <p>Password per tutti: <strong>Lumina-demo-2026</strong></p>
      <ul>
        <li>Giulia, Atelier Luce — giulia@atelierluce.test</li>
        <li>Marco, collaboratore — marco@atelierluce.test</li>
        <li>Elena, Palestra Borgo — elena@palestraborgo.test</li>
        <li>Bianca, cliente — bianca@email.test</li>
      </ul>
      <p class="muted">La pagina pubblica mostra gli slot ideali ancora liberi. La bacheca mostra la giornata già riempita.</p>
    </aside>
  <?php endif; ?>
</section>
