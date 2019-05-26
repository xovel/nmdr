/* eslint-disable block-scoped-var, no-redeclare */
window.onload = function () {
  var $lyricsExpand = document.querySelectorAll('.lyrics-expand');
  for (var i = 0; i < $lyricsExpand.length; i++) {
    (function (index) {
      $lyricsExpand[index].addEventListener('click', function () {
        var $pre = $lyricsExpand[index].parentNode.querySelector('pre');
        if ($pre.style.display === 'block') {
          $pre.style.display = 'none';
        } else {
          $pre.style.display = 'block';
        }
      });
    })(i);
  }

  var $itemListens = document.querySelectorAll('.item-listen');
  for (var i = 0; i < $itemListens.length; i++) {
    (function (index) {
      $itemListens[index].addEventListener('click', function () {
        var $listen = document.getElementById('listen');
        var prev;
        if ($listen) {
          $itemListens.forEach(function (item) {
            item.innerHTML = '试听';
          });
          prev = $listen.prev;
          $listen.parentNode.removeChild($listen);
        }

        var $href = $itemListens[index].parentNode.querySelector('a');
        var id = $href.getAttribute('href').split('id=')[1];

        if (prev === id) {
          return;
        }

        this.innerHTML = '取消试听';

        $listen = document.createElement('div');
        $listen.setAttribute('id', 'listen');
        $listen.prev = id;
        document.body.appendChild($listen);

        $listen.innerHTML = '<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=${width} height=${height} src="https://music.163.com/outchain/player?type=2&id=' + id + '&auto=${auto}&height=${innerHeight}"></iframe>';

        // <iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=1299557594&auto=1&height=66"></iframe>

        // var $iframe = document.createElement('iframe');
        // $listen.appendChild($iframe);

        // $iframe.setAttribute('frameborder', 'no');
        // $iframe.setAttribute('border', '0');
        // $iframe.setAttribute('marginwidth', '0');
        // $iframe.setAttribute('marginheight', '0');
        // $iframe.setAttribute('width', 320);
        // $iframe.setAttribute('height', 86);

        // $iframe.setAttribute('src', 'https://music.163.com/outchain/player?type=2&id=' + id + '&auto=1&height=66');

      });
    })(i);
  }
}
