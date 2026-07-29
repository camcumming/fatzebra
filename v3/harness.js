const testCards = [
  { number: '4000000000001000', group: '3ds2', description: 'Successful Frictionless Authentication' },
  { number: '4000000000001026', group: '3ds2', description: 'Attempts Stand-In Frictionless' },
  { number: '4000000000001034', group: '3ds2', description: 'Unavailable Frictionless' },
  { number: '4000000000001059', group: '3ds2', description: 'Authentication Not Available on Lookup' },
  { number: '4000000000001067', group: '3ds2', description: 'Error on Lookup' },
  { number: '4000000000001075', group: '3ds2', description: 'Timeout on cmpi_lookup' },
  { number: '4000000000001083', group: '3ds2', description: 'Bypassed Authentication' },
  { number: '4000000000001018', group: '3ds2', description: 'Failed Frictionless' },
  { number: '4000000000001042', group: '3ds2', description: 'Rejected Frictionless' },
  { number: '4000000000001091', group: '3ds2', description: 'Challenge' }
];

const cardListContainer = $('#card-list');

for (let i = 0; i < testCards.length; i++) {
  const c = testCards[i];
  cardListContainer.append(
    '<tr><td>' + c.group + '</td><td>' + c.number + '</td><td>' + c.description + '</td></tr>'
  );
}

$('#reference').val(crypto.randomUUID());
$('#return_path').val(window.location.href.replace('harness.html', 'callback.html'));

const SANDBOX_BASE = 'https://paynow.pmnts-sandbox.io/v3';

let generatedUrl = null;

function buildHashInput(reference, amount, currency) {
  const parts = [reference, amount, currency];

  if ($('#hide_card_holder').is(':checked')) parts.push('true');
  if ($('#return_path').val())               parts.push($('#return_path').val());
  if ($('#cards').val())                     parts.push($('#cards').val());
  if ($('#surcharge').is(':checked'))        parts.push('true');

  return parts.join(':');
}

function buildUrl(username, reference, currency, amount, hash) {
  let url = `${SANDBOX_BASE}/${username}/${reference}/${currency}/${amount}/${hash}`;

  const params = new URLSearchParams();

  if ($('#return_path').val())              params.set('return_path', $('#return_path').val());
  if ($('#return_target').val())           params.set('return_target', $('#return_target').val());
  if ($('#button_text').val())             params.set('button_text', $('#button_text').val());
  if ($('#cards').val())                   params.set('cards', $('#cards').val());
  if ($('#logo_url').val())                params.set('logo_url', $('#logo_url').val());
  if ($('#css').val())                     params.set('css', $('#css').val());
  if ($('#css_signature').val())           params.set('css_signature', $('#css_signature').val());
  if ($('#tokenize_only').is(':checked'))  params.set('tokenize_only', 'true');
  if ($('#auth').is(':checked'))           params.set('auth', 'true');
  if (!$('#show_email').is(':checked'))    params.set('show_email', 'false');
  if (!$('#show_extras').is(':checked'))   params.set('show_extras', 'false');
  if ($('#hide_card_holder').is(':checked')) params.set('hide_card_holder', 'true');
  if ($('#hide_button').is(':checked'))    params.set('hide_button', 'true');
  if ($('#surcharge').is(':checked'))      params.set('surcharge', 'true');
  if ($('#postmessage').is(':checked'))    params.set('postmessage', 'true');
  if ($('#iframe').is(':checked'))         params.set('iframe', 'true');

  const queryString = params.toString();
  if (queryString) url += '?' + queryString;

  return url;
}

$('#generate').click(function () {
  const username     = $('#username').val().trim();
  const sharedSecret = $('#sharedSecret').val().trim();
  const reference    = $('#reference').val().trim();
  const currency     = $('#currency').val().trim();
  const amount       = $('#amount').val().trim();

  $('#url-error').hide();
  $('#url-display').hide();
  $('#open-page').prop('disabled', true);
  $('#load-iframe').prop('disabled', true);
  generatedUrl = null;

  const errors = [];
  if (!username)     errors.push('username is required');
  if (!sharedSecret) errors.push('sharedSecret is required');
  if (!reference)    errors.push('reference is required');
  if (!currency)     errors.push('currency is required');
  if (!amount || isNaN(parseFloat(amount))) errors.push('amount must be a decimal number');

  if (errors.length) {
    $('#url-error').text(errors.join(', ')).show();
    return;
  }

  const hashInput = buildHashInput(reference, amount, currency);
  const hash      = CryptoJS.HmacMD5(hashInput, sharedSecret).toString();
  const url       = buildUrl(username, reference, currency, amount, hash);

  generatedUrl = url;
  $('#generated-url').val(url);
  $('#hash-input-display').text(hashInput);
  $('#url-display').show();
  $('#open-page').prop('disabled', false);
  $('#load-iframe').prop('disabled', false);
});

$('#open-page').click(function () {
  if (generatedUrl) window.open(generatedUrl, '_blank');
});

$('#load-iframe').click(function () {
  if (!generatedUrl) return;
  $('#fz-iframe').attr('src', generatedUrl);
  $('#iframe-container').show();
  $('html, body').animate({ scrollTop: $('#iframe-container').offset().top - 20 }, 400);
});

$('#clear-iframe').click(function () {
  $('#fz-iframe').attr('src', '');
  $('#iframe-container').hide();
});

$('#copy-url').click(function () {
  const input = document.getElementById('generated-url');
  input.select();
  document.execCommand('copy');
  $('#copy-url').text('Copied!');
  setTimeout(() => $('#copy-url').text('Copy'), 2000);
});
