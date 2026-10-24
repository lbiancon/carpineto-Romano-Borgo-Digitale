<section class="auth">
  <form class="card" method="post" action="/registrati">
    <?= csrf_field() ?>
    <?= redirect_field('/registrati') ?>
    <input type="hidden" name="account" value="business">
    <p class="kicker">Per chi lavora su appuntamento</p>
    <h1>Apri l'agenda</h1>
    <label class="field">Il tuo nome <input name="name" required value="<?= e(field('name')) ?>"></label>
    <label class="field">Email <input type="email" name="email" required value="<?= e(field('email')) ?>"></label>
    <label class="field">Telefono <input name="phone" value="<?= e(field('phone')) ?>"></label>
    <label class="field">Nome attività <input name="business_name" required value="<?= e(field('business_name')) ?>"></label>
    <label class="field">Città <input name="city" required value="<?= e(field('city')) ?>"></label>
    <label class="field">Tipo
      <select name="category">
        <?php foreach ($categories as $category): ?>
          <option value="<?= e($category->value) ?>"<?= selected('category', $category->value, 'hair') ?>><?= e($category->label()) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <div class="split">
      <label class="field">Password <input type="password" name="password" required minlength="10" autocomplete="new-password"></label>
      <label class="field">Ripeti <input type="password" name="password_confirm" required minlength="10" autocomplete="new-password"></label>
    </div>
    <button class="btn" type="submit">Crea l'attività</button>
    <p class="muted">Dal lunedì al venerdì ti prepariamo già 9–13 e 15–19. Poi aggiungi servizi e persone.</p>
  </form>
  <form class="card" method="post" action="/registrati">
    <?= csrf_field() ?>
    <?= redirect_field('/registrati') ?>
    <input type="hidden" name="account" value="client">
    <input type="hidden" name="business_name" value="-">
    <input type="hidden" name="city" value="-">
    <input type="hidden" name="category" value="other">
    <p class="kicker">Per chi prenota</p>
    <h2>Ho già un appuntamento</h2>
    <label class="field">Nome <input name="name" required value="<?= e(field('name')) ?>"></label>
    <label class="field">Email usata in prenotazione <input type="email" name="email" required></label>
    <div class="split">
      <label class="field">Password <input type="password" name="password" required minlength="10"></label>
      <label class="field">Ripeti <input type="password" name="password_confirm" required minlength="10"></label>
    </div>
    <button class="btn ghost" type="submit">Crea l'accesso cliente</button>
  </form>
</section>
