/*globals jQuery:false, config:false */
(function ($, document, window, undefined) {
  'use strict';

  // set title.
  document.title = config.TITLE;

  var $uiCreate = $('#ui-create'),
      $uiResult = $('#ui-result'),
      $uiUrl    = $('#ui-shortened-url'),
      $form     = $('form', $uiCreate),
      targetForm  = $('#form-target', $form),
      aliasForm   = $('#form-alias', $form),
      privateForm = $('#form-private', $form),
      $publicList  = $('#public-list'),
      $refreshButton = $('#refresh-button');

  $form.submit(function (e) {
    e.preventDefault();
    // prepare json data.
    var body = {
      to: targetForm.val(),
      alias: aliasForm.val(),
      private: privateForm.val() ? true : false
    };

    $.ajax(config.BASE_API + '/api/url', {
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      crossDomain: true,
      data: JSON.stringify(body),
      success: function (resp) {
        var url = makeUrl(resp.alias || resp.short);

        $uiResult.text(resp.short);
        $uiUrl.html('<a href="' + url +'">' + url + '</a>');
      }
    });
  });

  function makeUrl(short) {
    return config.BASE_API + config.PREFIX + short;
  }

  function refreshPublicUrl() {
    var tbody = $('tbody', $publicList);
    // clear.
    $('tr', tbody).remove();

    $.get(config.BASE_API + '/api/url')
    .done(function (resp) {
      // insert new ones.
      resp.forEach(function (item) {
        var url = makeUrl(item.alias || item.short);
        var link = '<a href="' + url + '">' + url + '</a>';
        var row =
          '<tr>' +
          '  <td>' + item.to + '</td>' +
          '  <td>' + link + '</td>' +
          '</tr>';
        tbody.append($(row));
      });
    });
  }
  refreshPublicUrl();
  $refreshButton.click(refreshPublicUrl);

})(jQuery, document, window);
