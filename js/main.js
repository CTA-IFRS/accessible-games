$(function () {
  const PREFS_KEY = 'accessibleGames.preferences';
  const FORCA_WORDS_KEY = 'palavrasForca';
  const FORCA_CATEGORIES_KEY = 'categoriasForca';
  const gameTitles = { 'tic-tac-toe': 'Jogo da Velha', jump: 'Jogo dos Saltos', forca: 'Jogo da Forca', baleia: 'A Baleia Faminta', colmeia: 'Colmeia' };
  function readJson(key, fallback) { try { const data = JSON.parse(localStorage.getItem(key)); return data == null ? fallback : data; } catch (_) { return fallback; } }
  function readPrefs() { const p = readJson(PREFS_KEY, {}); p.accessibility = Object.assign({ autoScan: false, scanInterval: 1000, highContrast: false }, p.accessibility || {}); if (![500, 1000, 2000].includes(Number(p.accessibility.scanInterval))) p.accessibility.scanInterval = 1000; return p; }
  let preferences = readPrefs();
  let scanTimer = null;
  let scanIndex = 0;
  let $scanItems = $();
  let $optionsTrigger = $();
  let modalTrigger = null;
  let activeGame = null;

  function scanRoot() {
    if ($('#gameOptionsDialog').is(':visible')) return $('#gameOptionsDialog');
    const $modal = $('.modal.show').first();
    return $modal.length ? $modal : $('#jogos');
  }
  function stopScan() { if (scanTimer) window.clearInterval(scanTimer); scanTimer = null; $('.game-scan-active').removeClass('game-scan-active'); }
  function scanHub(anchor) {
    stopScan();
    if (!preferences.accessibility.autoScan) return;
    const selector = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
    $scanItems = scanRoot().find(selector).filter(':visible');
    if (!$scanItems.length) return;
    const anchorIndex = $scanItems.index(anchor);
    scanIndex = anchorIndex >= 0 ? anchorIndex : 0;
    function focusCurrent() { $scanItems.removeClass('game-scan-active'); $scanItems.eq(scanIndex).addClass('game-scan-active').trigger('focus'); }
    focusCurrent();
    scanTimer = window.setInterval(function () {
      $scanItems = scanRoot().find(selector).filter(':visible');
      if ($scanItems.length) { scanIndex = (scanIndex + 1) % $scanItems.length; focusCurrent(); }
    }, preferences.accessibility.scanInterval);
  }
  function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(preferences)); }
  function applyAccessibility() {
    $('body').toggleClass('high-contrast', preferences.accessibility.highContrast);
    $('#hub-auto-scan').prop('checked', preferences.accessibility.autoScan);
    $('#hub-scan-speed').val(String(preferences.accessibility.scanInterval));
    $('#hub-high-contrast').prop('checked', preferences.accessibility.highContrast);
    $('#contrast-shortcut').attr('aria-pressed', String(preferences.accessibility.highContrast));
  }
  applyAccessibility();
  if (window.location.hash === '#jogos') {
    $('#jogos').attr('tabindex', '-1').trigger('focus');
  }
  $('#contrast-shortcut').on('click', function () {
    $('#hub-high-contrast').prop('checked', !$('#hub-high-contrast').prop('checked')).trigger('change');
  });
  $(window).on('scroll', function () {
    $('.back-to-top').toggleClass('is-visible', window.scrollY > 350);
  }).trigger('scroll');
  $('#hub-auto-scan, #hub-scan-speed, #hub-high-contrast').on('change', function () {
    preferences.accessibility.autoScan = $('#hub-auto-scan').prop('checked');
    preferences.accessibility.scanInterval = Number($('#hub-scan-speed').val()) || 1000;
    preferences.accessibility.highContrast = $('#hub-high-contrast').prop('checked');
    savePrefs(); applyAccessibility(); scanHub(this);
  });
  $(document).on('keydown.hubScan', function (event) {
    if (!preferences.accessibility.autoScan || event.repeat || !['Enter', ' '].includes(event.key)) return;
    const target = $scanItems[scanIndex];
    if (!target || document.activeElement !== target || !target.matches('button:not(:disabled),a[href]')) return;
    event.preventDefault();
    stopScan();
    target.click();
    if (!target.matches('a[href]') && !target.matches('[data-bs-toggle="modal"]') && !target.matches('[data-bs-dismiss="modal"]') && !target.matches('[data-game-options]') && !target.matches('[data-close-options]')) scanHub(target);
  });
  $(document).on('show.bs.modal', '.modal', function (event) { modalTrigger = event.relatedTarget || document.activeElement; stopScan(); });
  $(document).on('shown.bs.modal', '.modal', function () { scanHub(); });
  $(document).on('hidden.bs.modal', '.modal', function () { scanHub(modalTrigger); modalTrigger = null; });

  const $dialog = $('#gameOptionsDialog');
  const $title = $('#gameOptionsTitle');
  const $fields = $('#gameOptionsFields');
  function closeOptions() {
    $dialog.prop('hidden', true);
    if ($optionsTrigger.length) $optionsTrigger.trigger('focus');
    scanHub($optionsTrigger[0]);
  }
  function renderColmeia() {
    let words = readJson('palavrasColmeia', ['IFRS', 'ACESSIBILIDADE', 'CTA']);
    if (!Array.isArray(words)) words = [];
    if (localStorage.getItem('palavrasColmeia') === null) localStorage.setItem('palavrasColmeia', JSON.stringify(words));
    const $form = $('<form id="teacherWordForm" class="teacher-editor-form teacher-panel">');
    const $input = $('<input class="form-control" name="word" maxlength="20" required aria-label="Nova palavra">').attr('placeholder', 'Digite uma palavra');
    $form.append($('<h3><i class="bi bi-plus-circle" aria-hidden="true"></i> Adicionar palavra</h3>'), $('<p class="teacher-panel-hint">').text('Digite uma palavra para usar na Colmeia.'), $('<label>').text('Nova palavra').append($input), $('<button type="submit" class="btn btn-primary">').text('Adicionar palavra'));
    const $list = $('<ul class="teacher-item-list" aria-label="Palavras cadastradas">');
    const $count = $('<span class="teacher-count">');
    function renderList() {
      $list.empty(); $count.text(`${words.length} ${words.length === 1 ? 'palavra' : 'palavras'}`);
      if (!words.length) $list.append($('<li class="teacher-empty">').text('Nenhuma palavra cadastrada. Adicione a primeira ao lado.'));
      words.forEach((word, index) => {
        const $remove = $('<button type="button" class="btn btn-outline-secondary teacher-remove">').html('<i class="bi bi-trash" aria-hidden="true"></i><span>Remover</span>').attr('aria-label', `Remover palavra ${word}`).on('click', function () { words.splice(index, 1); localStorage.setItem('palavrasColmeia', JSON.stringify(words)); renderList(); });
        $list.append($('<li>').append($('<span>').text(word), $remove));
      });
    }
    $form.on('submit', function (event) {
      event.preventDefault(); const word = String($input.val()).trim().toUpperCase();
      if (word && !words.includes(word)) { words.push(word); localStorage.setItem('palavrasColmeia', JSON.stringify(words)); renderList(); }
      $input.val('').trigger('focus');
    });
    const $saved = $('<section class="teacher-panel teacher-saved">').append($('<div class="teacher-panel-heading">').append($('<h3><i class="bi bi-collection" aria-hidden="true"></i> Palavras cadastradas</h3>'), $count), $list);
    renderList(); $fields.append($('<div class="teacher-layout teacher-layout-colmeia">').append($form, $saved));
  }
  function renderForca() {
    let words = readJson(FORCA_WORDS_KEY, []);
    if (!Array.isArray(words)) words = [];
    let categories = readJson(FORCA_CATEGORIES_KEY, []);
    if (!Array.isArray(categories)) categories = [];
    categories = [...new Set([...categories, ...words.map(item => item.category || 'Geral')])];
    if (!categories.length) categories = ['Geral'];
    localStorage.setItem(FORCA_CATEGORIES_KEY, JSON.stringify(categories));

    const $categoryForm = $('<form class="teacher-editor-form teacher-panel">').append($('<h3><i class="bi bi-tags" aria-hidden="true"></i> Categorias</h3>'), $('<p class="teacher-panel-hint">').text('Agrupe as palavras por tema.'));
    const $categoryInput = $('<input class="form-control" maxlength="40" required aria-label="Nova categoria" placeholder="Nome da categoria">');
    const $categoryList = $('<ul class="teacher-item-list">');
    const $wordForm = $('<form id="teacherForcaWordForm" class="teacher-editor-form teacher-panel">').append($('<h3><i class="bi bi-plus-circle" aria-hidden="true"></i> Adicionar palavra</h3>'), $('<p class="teacher-panel-hint">').text('Defina a palavra, a dificuldade e um ícone opcional.'));
    const $categorySelect = $('<select class="form-select" name="category" aria-label="Categoria">');
    const $wordInput = $('<input class="form-control" name="word" maxlength="30" required aria-label="Palavra" placeholder="Palavra">');
    const $iconInput = $('<input class="form-control" name="url" type="text" aria-label="URL do ícone" placeholder="https://... ou /forca/imagens/icone.png">');
    const $difficulty = $('<select class="form-select" name="difficulty" aria-label="Dificuldade">').append('<option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>');
    const $wordList = $('<ul class="teacher-item-list" aria-label="Palavras e ícones cadastrados">');
    const $categoryCount = $('<span class="teacher-count">');
    const $wordCount = $('<span class="teacher-count">');
    function saveCategories() { localStorage.setItem(FORCA_CATEGORIES_KEY, JSON.stringify(categories)); }
    function saveWords() { localStorage.setItem(FORCA_WORDS_KEY, JSON.stringify(words)); }
    function renderCategories() {
      $categorySelect.empty(); categories.forEach(category => $('<option>').val(category).text(category).appendTo($categorySelect));
      $categoryList.empty(); $categoryCount.text(`${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}`);
      categories.forEach(category => {
        const hasWords = words.some(item => (item.category || 'Geral') === category);
        const $delete = $('<button type="button" class="btn btn-outline-secondary teacher-remove">').html('<i class="bi bi-trash" aria-hidden="true"></i><span>Remover</span>').prop('disabled', hasWords || categories.length === 1).attr('aria-label', `Remover categoria ${category}`).attr('title', hasWords ? 'Remova as palavras desta categoria antes de excluí-la' : '').on('click', function () { categories = categories.filter(item => item !== category); saveCategories(); renderCategories(); });
        $categoryList.append($('<li>').append($('<span>').text(category), $delete));
      });
    }
    function renderWords() {
      $wordList.empty(); $wordCount.text(`${words.length} ${words.length === 1 ? 'palavra' : 'palavras'}`);
      if (!words.length) $wordList.append($('<li class="teacher-empty">').text('Nenhuma palavra cadastrada. Adicione a primeira acima.'));
      words.forEach((item, index) => {
        const category = item.category || 'Geral';
        const $details = $('<span class="teacher-word-details">');
        if (item.url) $details.append($('<img class="teacher-word-icon" alt="">').attr('src', item.url));
        $details.append($('<strong>').text(item.word), $('<small>').text(`${category} · ${item.difficulty || 'easy'}`));
        const $remove = $('<button type="button" class="btn btn-outline-secondary teacher-remove">').html('<i class="bi bi-trash" aria-hidden="true"></i><span>Remover</span>').attr('aria-label', `Remover palavra ${item.word}`).on('click', function () { words.splice(index, 1); saveWords(); renderCategories(); renderWords(); });
        $wordList.append($('<li>').append($details, $remove));
      });
    }
    $categoryForm.append($('<label>').text('Nova categoria').append($categoryInput), $('<button type="submit" class="btn btn-outline-primary">').text('Adicionar categoria'), $('<div class="teacher-panel-heading teacher-subheading">').append($('<h4>').text('Categorias disponíveis'), $categoryCount), $categoryList);
    $categoryForm.on('submit', function (event) {
      event.preventDefault(); const name = String($categoryInput.val()).trim();
      if (name && !categories.some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())) { categories.push(name); saveCategories(); renderCategories(); }
      $categoryInput.val('').trigger('focus');
    });
    $wordForm.append($('<div class="teacher-field-grid">').append($('<label>').text('Palavra').append($wordInput), $('<label>').text('Categoria').append($categorySelect), $('<label>').text('Dificuldade').append($difficulty), $('<label>').text('Ícone (URL ou caminho)').append($iconInput)), $('<button type="submit" class="btn btn-primary">').text('Adicionar palavra'));
    $wordForm.on('submit', function (event) {
      event.preventDefault(); const word = String($wordInput.val()).trim().toLocaleUpperCase(); const category = $categorySelect.val();
      if (word && !words.some(item => item.word.toLocaleUpperCase() === word && (item.category || 'Geral') === category)) {
        let url = String($iconInput.val()).trim();
        if (url && !/^(https?:)?\/\//i.test(url) && !url.startsWith('/')) url = url.replace(/^\.\//, '');
        words.push({ word, category, url, difficulty: $difficulty.val() }); saveWords(); renderCategories(); renderWords();
      }
      $wordInput.val('').trigger('focus'); $iconInput.val('');
    });
    const $saved = $('<section class="teacher-panel teacher-saved">').append($('<div class="teacher-panel-heading">').append($('<h3><i class="bi bi-list-check" aria-hidden="true"></i> Palavras cadastradas</h3>'), $wordCount), $wordList);
    renderCategories(); renderWords(); $fields.append($('<div class="teacher-layout teacher-layout-forca">').append($categoryForm, $('<div class="teacher-main-column">').append($wordForm, $saved)));
  }
  $('[data-game-options]').on('click', function () {
    $optionsTrigger = $(this); activeGame = String($(this).data('game-options'));
    $title.text(`Opções do professor — ${gameTitles[activeGame] || 'Jogo'}`); $fields.empty();
    if (activeGame === 'colmeia') renderColmeia();
    else if (activeGame === 'forca') renderForca();
    else $fields.append($('<p>').text('As opções de personalização deste jogo serão definidas na próxima etapa.'));
    $dialog.prop('hidden', false);
    if (preferences.accessibility.autoScan) scanHub(0);
    else $dialog.find('input,select,button').filter(':visible').first().trigger('focus');
  });
  $('[data-close-options]').on('click', closeOptions);
  $dialog.on('click', function (event) { if (event.target === this) closeOptions(); });
  $(document).on('keydown.hubOptions', function (event) { if (event.key === 'Escape' && !$dialog.prop('hidden')) closeOptions(); });
  scanHub(0);
});
