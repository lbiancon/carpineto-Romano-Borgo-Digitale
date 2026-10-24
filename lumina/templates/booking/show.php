<?php
$tz = new DateTimeZone((string) $business['timezone']);
$serviceId = $service === null ? 0 : (int) $service['id'];
$keep = static function (array $extra) use ($business, $serviceId, $staffId, $email): string {
    $params = [
        'servizio' => $serviceId > 0 ? $serviceId : null,
        'staff' => $staffId > 0 ? $staffId : null,
        'email' => $email !== '' ? $email : null,
    ];
    foreach ($extra as $key => $value) {
        $params[$key] = $value;
    }
    $params = array_filter($params, static fn (mixed $value): bool => $value !== null && $value !== '' && $value !== 0);
    $query = http_build_query($params);

    return '/b/' . $business['slug'] . ($query === '' ? '' : '?' . $query);
};
$anchorDate = DateTimeImmutable::createFromFormat('!Y-m-d', $anchor) ?: new DateTimeImmutable('today');
$groups = [
    'ideal' => ['Ideali', 'Riempiono esattamente un buco già aperto.'],
    'adjacent' => ['Aderenti', 'Si attaccano a un impegno, senza scarto.'],
    'open' => ['Liberi', 'Lontani dagli altri impegni.'],
    'fragment' => ['Spezzati', 'Lasciano meno di 30 minuti. Si possono prenotare lo stesso, ma restano in fondo.'],
];
$clientUser = $user !== null && (string) $user['role'] === 'client';
?>
<section class="section">
  <div class="booking-head">
    <div>
      <p class="kicker"><?= e(category_label((string) $business['category'])) ?> · <?= e($business['city']) ?></p>
      <h1><?= e($business['name']) ?></h1>
      <p class="lede"><?= e($business['tagline']) ?></p>
    </div>
    <p class="muted"><?= e(trim($business['address'] . ' ' . $business['city'])) ?><?php if ($business['phone'] !== ''): ?> · <?= e($business['phone']) ?><?php endif; ?></p>
  </div>
  <?php if ($business['description'] !== ''): ?><p><?= e($business['description']) ?></p><?php endif; ?>

  <h2>Servizio</h2>
  <div class="services">
    <?php foreach ($services as $item): ?>
      <a class="service-link<?= $serviceId === (int) $item['id'] ? ' on' : '' ?>" href="<?= e($keep(['servizio' => (int) $item['id'], 'staff' => null, 'data' => null, 'da' => null])) ?>">
        <strong><?= e($item['name']) ?></strong>
        <span><?= (int) $item['duration_min'] ?> min<?php if ((int) $item['buffer_after'] + (int) $item['buffer_before'] > 0): ?> + <?= (int) $item['buffer_before'] + (int) $item['buffer_after'] ?> di margine<?php endif; ?></span>
        <span class="price"><?= e(euro((int) $item['price_cents'])) ?></span>
      </a>
    <?php endforeach; ?>
    <?php if ($services === []): ?><p class="empty">Nessun servizio prenotabile in questo momento.</p><?php endif; ?>
  </div>

  <?php if ($service !== null): ?>
    <h2><?= e($service['name']) ?></h2>
    <?php if ($service['description'] !== ''): ?><p class="muted"><?= e($service['description']) ?></p><?php endif; ?>
    <div class="people">
      <a class="staff-pill<?= $staffId === 0 ? ' on' : '' ?>" href="<?= e($keep(['staff' => null])) ?>">Chi è libero</a>
      <?php foreach ($eligible as $person): ?>
        <a class="staff-pill<?= $staffId === (int) $person['id'] ? ' on' : '' ?>" href="<?= e($keep(['staff' => (int) $person['id']])) ?>">
          <i class="dot" style="background: <?= e(hex_color($person['color'])) ?>"></i>
          <?= e($person['name']) ?>
        </a>
      <?php endforeach; ?>
    </div>

    <div class="daystrip">
      <a class="btn small ghost" href="<?= e($keep(['da' => $anchorDate->modify('-10 days')->format('Y-m-d'), 'data' => $anchorDate->modify('-10 days')->format('Y-m-d')])) ?>">Indietro</a>
      <div class="days">
        <?php foreach ($dots as $dot): ?>
          <?php $day = DateTimeImmutable::createFromFormat('!Y-m-d', $dot['date']); ?>
          <a class="day<?= $dot['date'] === $date ? ' on' : '' ?>" href="<?= e($keep(['da' => $anchor, 'data' => $dot['date']])) ?>">
            <span><?= e($day ? mb_substr(weekday_name((int) $day->format('N')), 0, 3) : '') ?></span>
            <strong><?= e($day ? $day->format('j') : '') ?></strong>
            <?php if ((int) $dot['ideals'] > 0): ?><em><?= (int) $dot['ideals'] ?> ideali</em>
            <?php elseif ((int) $dot['count'] > 0): ?><em><?= (int) $dot['count'] ?></em>
            <?php else: ?><em>chiuso</em><?php endif; ?>
          </a>
        <?php endforeach; ?>
      </div>
      <a class="btn small ghost" href="<?= e($keep(['da' => $anchorDate->modify('+10 days')->format('Y-m-d'), 'data' => $anchorDate->modify('+10 days')->format('Y-m-d')])) ?>">Avanti</a>
    </div>

    <div class="grid two">
      <div>
        <?php if ($slotCount === 0): ?>
          <p class="empty">Nessun orario in questo giorno. Prova un'altra data o entra in lista d'attesa.</p>
        <?php endif; ?>
        <?php foreach ($groups as $quality => [$heading, $hint]): ?>
          <?php if (($slots[$quality] ?? []) === []) continue; ?>
          <h3><?= e($heading) ?></h3>
          <p class="muted"><?= e($hint) ?></p>
          <div class="slots">
            <?php foreach ($slots[$quality] as $slot): ?>
              <?php
                $start = $slot['starts_at']->setTimezone($tz);
                $token = (int) $slot['staff_id'] . '|' . (int) ($slot['resource_id'] ?? 0) . '|' . $slot['starts_at']->getTimestamp();
                $text = $start->format('H:i') . ' · ' . $slot['staff_name'] . ' · ' . euro((int) $slot['price_cents']);
              ?>
              <label class="slot <?= e($quality) ?>" data-label="<?= e($text) ?>">
                <span><input type="radio" name="slot" value="<?= e($token) ?>" required> <strong><?= e($start->format('H:i')) ?></strong></span>
                <span><i class="dot" style="background: <?= e(hex_color($slot['staff_color'])) ?>"></i> <?= e($slot['staff_name']) ?><?php if ($slot['resource_name']): ?> · <?= e($slot['resource_name']) ?><?php endif; ?></span>
                <span class="price">
                  <?php if ((int) $slot['price_cents'] !== (int) $slot['list_price_cents']): ?><s><?= e(euro((int) $slot['list_price_cents'])) ?></s><?php endif; ?>
                  <?= e(euro((int) $slot['price_cents'])) ?>
                  <?php if ($slot['price_label'] !== ''): ?><span class="badge"><?= e($slot['price_label']) ?></span><?php endif; ?>
                </span>
                <small class="muted"><?= e($slot['reason']) ?></small>
              </label>
            <?php endforeach; ?>
          </div>
        <?php endforeach; ?>
      </div>
      <aside>
        <form class="card" id="prenota" method="post" action="/b/<?= e($business['slug']) ?>">
          <?= csrf_field() ?>
          <?= redirect_field($keep(['da' => $anchor, 'data' => $date])) ?>
          <input type="hidden" name="service_id" value="<?= $serviceId ?>">
          <input type="hidden" name="slot" value="">
          <div class="honeypot" aria-hidden="true"><label>Sito <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <h2>Conferma</h2>
          <p data-slot-summary class="notice">Scegli un orario nella lista.</p>
          <?php if ($clientUser): ?>
            <p>Prenoti come <strong><?= e($user['name']) ?></strong></p>
          <?php else: ?>
            <label class="field">Nome e cognome <input name="name" required value="<?= e(field('name', $known['name'] ?? '')) ?>"></label>
            <label class="field">Email <input type="email" name="email" required value="<?= e(field('email', $email)) ?>"></label>
          <?php endif; ?>
          <label class="field">Telefono <input name="phone" value="<?= e(field('phone')) ?>" autocomplete="tel"></label>
          <label class="field">Note <textarea name="notes"><?= e(field('notes')) ?></textarea></label>
          <?php if ($cards !== []): ?>
            <label class="checks"><input type="checkbox" name="use_package" value="1"> Usa la tessera (<?= (int) $cards[0]['credits_left'] ?> crediti, <?= e($cards[0]['name']) ?>)</label>
          <?php endif; ?>
          <?php if ($known !== null && $known['preferred_staff_id'] !== null): ?>
            <p class="muted">In scheda risulta un operatore preferito: puoi comunque scegliere chi vuoi.</p>
          <?php endif; ?>
          <button class="btn block" type="submit">Prenota</button>
          <p class="muted">Annulli gratis fino a <?= (int) $business['cancel_hours'] ?> ore prima. La caparra, se serve, si concorda in sede: qui non si paga online.</p>
        </form>
        <?php if (!$clientUser && $email === ''): ?>
          <form class="card" method="get" action="/b/<?= e($business['slug']) ?>">
            <input type="hidden" name="servizio" value="<?= $serviceId ?>">
            <?php if ($staffId > 0): ?><input type="hidden" name="staff" value="<?= $staffId ?>"><?php endif; ?>
            <input type="hidden" name="data" value="<?= e($date) ?>">
            <label class="field">Hai già una tessera? Inserisci l'email <input type="email" name="email" required></label>
            <button class="btn small ghost" type="submit">Cerca</button>
          </form>
        <?php endif; ?>
      </aside>
    </div>

    <h2>Lista d'attesa</h2>
    <form class="card" method="post" action="/b/<?= e($business['slug']) ?>/attesa">
      <?= csrf_field() ?>
      <?= redirect_field($keep(['da' => $anchor, 'data' => $date])) ?>
      <input type="hidden" name="service_id" value="<?= $serviceId ?>">
      <div class="honeypot" aria-hidden="true"><label>Sito <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <p>Se si libera un posto nel giorno che indichi, lo proponiamo a chi è in lista da più tempo. L'offerta resta aperta tre ore, o fino all'orario se manca meno.</p>
      <div class="split">
        <?php if (!$clientUser): ?>
          <label class="field">Nome <input name="name" required value="<?= e(field('name')) ?>"></label>
          <label class="field">Email <input type="email" name="email" required value="<?= e(field('email', $email)) ?>"></label>
        <?php endif; ?>
        <label class="field">Telefono <input name="phone" value="<?= e(field('phone')) ?>"></label>
        <label class="field">Giorno <input type="date" name="date" required value="<?= e($date) ?>"></label>
        <label class="field">Dalle <input type="time" name="time_from" required value="09:00"></label>
        <label class="field">Alle <input type="time" name="time_to" required value="19:00"></label>
        <label class="field">Operatore
          <select name="staff_id">
            <option value="0">Chiunque</option>
            <?php foreach ($eligible as $person): ?>
              <option value="<?= (int) $person['id'] ?>"<?= $staffId === (int) $person['id'] ? ' selected' : '' ?>><?= e($person['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </label>
      </div>
      <button class="btn" type="submit">Mettimi in lista</button>
    </form>
  <?php endif; ?>

  <?php if ($sessions !== []): ?>
    <h2>Corsi in arrivo</h2>
    <div class="list">
      <?php foreach ($sessions as $session): ?>
        <?php $left = max(0, (int) $session['capacity'] - (int) $session['taken']); ?>
        <article class="card">
          <strong><?= e($session['service_name']) ?></strong>
          <p><?= e(dt((string) $session['starts_at'], (string) $business['timezone'])) ?> · <?= e($session['staff_name']) ?> · <?= $left ?> posti su <?= (int) $session['capacity'] ?></p>
          <?php if ($left > 0): ?>
            <form method="post" action="/b/<?= e($business['slug']) ?>/corso">
              <?= csrf_field() ?>
              <?= redirect_field('/b/' . $business['slug']) ?>
              <input type="hidden" name="session_id" value="<?= (int) $session['id'] ?>">
              <div class="honeypot" aria-hidden="true"><label>Sito <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
              <?php if (!$clientUser): ?>
                <div class="split">
                  <label class="field">Nome <input name="name" required></label>
                  <label class="field">Email <input type="email" name="email" required value="<?= e($email) ?>"></label>
                </div>
              <?php else: ?>
                <p>Iscrizione a nome di <?= e($user['name']) ?>.</p>
              <?php endif; ?>
              <label class="field">Telefono <input name="phone"></label>
              <label class="checks"><input type="checkbox" name="use_package" value="1"> Scala un credito, se hai una tessera valida</label>
              <button class="btn small" type="submit">Iscriviti · <?= e(euro((int) $session['price_cents'])) ?></button>
            </form>
          <?php else: ?>
            <p class="muted">Completo.</p>
          <?php endif; ?>
        </article>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</section>
