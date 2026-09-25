(function ($) {
  'use strict';
  const storageKey = 'accessibleGames.preferences';
  function readPreferences() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (_) { return {}; }
  }
  $(function () {
    const pageName = location.pathname.split('/').filter(Boolean).slice(-2)[0] || '';
    const preferences = readPreferences();
    const accessibility = preferences.accessibility || { autoScan: false, scanInterval: 1000, highContrast: false };
    if (![500, 1000, 2000].includes(Number(accessibility.scanInterval))) accessibility.scanInterval = 1000;
    $('body').toggleClass('high-contrast', !!accessibility.highContrast);
    const $menu = $('.game-menu');
    if (!$menu.length) return;
    const $sections = $menu.find('.game-menu-section');
    const $main = $('.game-main').attr('tabindex', '0');
    let sectionIndex = 0;
    let selected = {};
    let scanTimer = null;
    let scanIndex = 0;
    let scanItems = $();
    let mode = 'menu';

    if (pageName === 'forca') {
      let entries = [];
      try { entries = JSON.parse(localStorage.getItem('palavrasForca')) || []; } catch (_) {}
      let savedCategories = [];
      try { savedCategories = JSON.parse(localStorage.getItem('categoriasForca')) || []; } catch (_) {}
      const categories = [...new Set([...savedCategories, ...entries.map(item => item.category || 'Geral')])];
      if (!categories.length) categories.push('Geral');
      const $choices = $sections.filter('[data-key="category"]').find('.game-menu-options').empty();
      categories.forEach(category => $('<button type="button" class="menu-option">').attr({ 'data-key': 'category', 'data-value': category }).text(category).appendTo($choices));
    }

    function visibleItems($root) {
      if (pageName === 'forca' && mode === 'game' && $root.is($main)) {
        return $root.find('#keyboard .key:not(:disabled)').filter(':visible');
      }
      const selector = 'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
      const $items = $root.find(selector).add($root.filter(selector)).filter(':visible');
      if (mode === 'menu' && $root.hasClass('game-menu-section')) {
        return $($items.get().concat($('.game-home:visible').get()));
      }
      return $items;
    }
    function stopScan() {
      if (scanTimer) window.clearInterval(scanTimer);
      scanTimer = null;
      scanItems = $();
      $('.game-scan-active').removeClass('game-scan-active');
    }
    function scanFocus(index) {
      if (!scanItems.length) return;
      scanIndex = (index + scanItems.length) % scanItems.length;
      scanItems.removeClass('game-scan-active');
      scanItems.eq(scanIndex).addClass('game-scan-active').trigger('focus');
    }
    function startScan($root) {
      const activeElement = document.activeElement;
      stopScan();
      if (!accessibility.autoScan) return;
      if (mode === 'game' && ['colmeia', 'jump', 'baleia'].includes(pageName) && $root.is($main)) return;
      scanItems = visibleItems($root || $('body'));
      if (!scanItems.length) return;
      const activeIndex = scanItems.index(activeElement);
      scanFocus(activeIndex >= 0 ? activeIndex : 0);
      scanTimer = window.setInterval(function () {
        const currentItem = scanItems[scanIndex];
        scanItems = visibleItems($root || $('body'));
        if (scanItems.length) {
          const currentIndex = scanItems.index(currentItem);
          scanFocus(currentIndex >= 0 ? currentIndex + 1 : Math.min(scanIndex, scanItems.length - 1));
        }
      }, Number(accessibility.scanInterval) || 1000);
    }
    function setVisible($element, visible) {
      $element.prop('hidden', !visible);
      if ($element.hasClass('game-over-screen')) $element.css('display', visible ? 'grid' : 'none');
      if ($element.is('#gameContainer') && pageName === 'forca') $('#keyboard').prop('hidden', !visible);
    }
    function invoke(method) {
      if (window.GameModule && typeof window.GameModule[method] === 'function') window.GameModule[method](selected);
    }
    function startGame() {
      mode = 'game'; setVisible($menu, false); setVisible($main, true); $('#gameOverMenu').hide(); setVisible($('.game-over-screen'), false);
      invoke('start');
      const $gameOver = $('#gameOverMenu');
      const $nativeGameOver = $('.game-over-screen:visible').first();
      const $scanRoot = $gameOver.length && $gameOver.is(':visible') ? $gameOver : ($nativeGameOver.length ? $nativeGameOver : $main);
      startScan($scanRoot);
      if (!accessibility.autoScan) $scanRoot.find('button:not(:disabled),[tabindex="0"]').first().trigger('focus');
    }
    function advance() {
      const $option = scanItems.length ? scanItems.eq(scanIndex) : $sections.eq(sectionIndex).find('.menu-option:focus');
      const $focusedOption = $option.filter('.menu-option').add($sections.eq(sectionIndex).find('.menu-option:focus'));
      const $choice = $focusedOption.first();
      if (!$choice.length) return;
      const key = $choice.data('key') || $sections.eq(sectionIndex).data('key');
      selected[key] = $choice.data('value');
      $choice.addClass('selected').siblings('.menu-option').removeClass('selected');
      const $current = $sections.eq(sectionIndex);
      const $next = $sections.eq(sectionIndex + 1);
      if ($next.length) {
        $current.prop('hidden', true); sectionIndex++; $next.prop('hidden', false); startScan($next);
        if (!accessibility.autoScan) $next.find('.menu-option').first().trigger('focus');
      } else startGame();
    }
    $sections.each(function (index) { $(this).prop('hidden', index !== 0); });
    $sections.each(function () { $(this).find('.menu-option').attr('type', 'button').attr('tabindex', '0'); });
    $menu.on('click', '.menu-option', function () {
      scanItems = $(this); scanIndex = 0; advance();
    });
    function refreshMenuScan() { startScan($sections.eq(sectionIndex)); }
    $(document).on('keydown.gameCommon', function (event) {
      if (mode === 'menu' && event.key === 'Escape') { window.GameCommon.backToHub(); return; }
      if (!accessibility.autoScan || event.repeat || !scanItems.length || !['Enter', ' '].includes(event.key)) return;
      const target = scanItems[scanIndex];
      if (target && document.activeElement === target && target.matches('button:not(:disabled),a[href]')) {
        event.preventDefault();
        target.click();
      }
    });
    window.GameCommon = {
      preferences: accessibility,
      startScan: function () {
        const $nativeGameOver = $('.game-over-screen:visible').first();
        startScan(mode === 'menu' ? $sections.eq(sectionIndex) : ($nativeGameOver.length ? $nativeGameOver : $main));
      },
      stopScan,
      backToHub: function () { stopScan(); invoke('stop'); window.location.href = '../../index.html#jogos'; },
      backToMenu: function () {
        stopScan(); invoke('stop'); $('#gameOverMenu').hide(); setVisible($('.game-over-screen'), false); setVisible($main, false); setVisible($menu, true);
        $sections.find('.menu-option').removeClass('selected'); $sections.each(function (index) { $(this).prop('hidden', index !== 0); }); sectionIndex=0; selected={}; mode='menu'; refreshMenuScan();
        if (!accessibility.autoScan) $sections.eq(0).find('.menu-option').first().trigger('focus');
      },
      restart: startGame
    };
    window.showGameOver = function (message) {
      stopScan(); let $overlay = $('#gameOverMenu');
      if (!$overlay.length) $overlay = $('<div id="gameOverMenu" role="dialog" aria-modal="true"><div class="game-over-content"><h2>Fim de jogo</h2><p class="game-over-message"></p><button class="game-over-option" data-action="restart">Jogar novamente</button><button class="game-over-option" data-action="menu">Voltar ao menu</button></div></div>').appendTo('.game-monitor-screen');
      setVisible($main, false);
      setVisible($('.game-over-screen'), false);
      $overlay.attr('aria-labelledby', 'gameOverTitle');
      $overlay.find('.game-over-content h2').attr('id', 'gameOverTitle');
      $overlay.find('.game-over-message').text(message || '');
      $overlay.show().off('click.common').on('click.common', '.game-over-option', function () {
        const action = $(this).data('action');
        if (action === 'restart') startGame();
        else window.GameCommon.backToMenu();
      });
      startScan($overlay);
      if (!accessibility.autoScan) $overlay.find('.game-over-option').first().trigger('focus');
    };
    setVisible($menu, true);
    setVisible($main, false);
    refreshMenuScan();
    if (!accessibility.autoScan) $sections.eq(0).find('.menu-option').first().trigger('focus');
  });
})(jQuery);
