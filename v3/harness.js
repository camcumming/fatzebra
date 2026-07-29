const testCards = [
  { network: 'Visa',       number: '4000000000001000', scenario: '3DS2 Frictionless — Successful Authentication' },
  { network: 'Mastercard', number: '5200000000001005', scenario: '3DS2 Frictionless — Successful Authentication' },
  { network: 'Amex',       number: '340000000001007',  scenario: '3DS2 Frictionless — Successful Authentication' },
  { network: 'Visa',       number: '4000000000001026', scenario: '3DS2 Frictionless — Attempts Stand-In' },
  { network: 'Mastercard', number: '5200000000001021', scenario: '3DS2 Frictionless — Attempts Stand-In' },
  { network: 'Amex',       number: '340000000001023',  scenario: '3DS2 Frictionless — Attempts Stand-In' },
  { network: 'Visa',       number: '4000000000001091', scenario: '3DS2 — Challenge Required' },
  { network: 'Mastercard', number: '5200000000001096', scenario: '3DS2 — Challenge Required' },
  { network: 'Amex',       number: '340000000001098',  scenario: '3DS2 — Challenge Required' },
  { network: 'Visa',       number: '4000000000001018', scenario: '3DS2 Frictionless — Failed Authentication' },
  { network: 'Visa',       number: '4000000000001042', scenario: '3DS2 Frictionless — Rejected Authentication' },
];

const cardListContainer = $('#card-list');
for (let i = 0; i < testCards.length; i++) {
  const c = testCards[i];
  cardListContainer.append(
    '<tr style="cursor:pointer" data-number="' + c.number + '">' +
    '<td>' + c.network + '</td>' +
    '<td><code>' + c.number + '</code></td>' +
    '<td>' + c.scenario + '</td></tr>'
  );
}

$('#card-list').on('click', 'tr', function () {
  navigator.clipboard.writeText($(this).data('number'));
  $('#test-card-modal').modal('hide');
});

const CREDS_COOKIE = 'fz_creds';
const COOKIE_PATH  = '/fatzebra/';

function saveCreds(username, sharedSecret) {
  const merged = Object.assign(loadCreds() || {}, { username, sharedSecret });
  document.cookie = CREDS_COOKIE + '=' + encodeURIComponent(JSON.stringify(merged)) +
    '; max-age=28800; Secure; SameSite=Strict; Path=' + COOKIE_PATH;
}

function loadCreds() {
  const match = document.cookie.split('; ').find(r => r.startsWith(CREDS_COOKIE + '='));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))); }
  catch (e) { return null; }
}

function clearCreds() {
  document.cookie = CREDS_COOKIE + '=; max-age=0; Secure; SameSite=Strict; Path=' + COOKIE_PATH;
}

function updateCredsStatus() {
  $('#no-creds-alert').toggle(!loadCreds());
}

$('#credentials-modal').on('show.bs.modal', function () {
  const c = loadCreds() || {};
  $('#cred-username').val(c.username || '');
  $('#cred-shared-secret').val(c.sharedSecret || '');
});

$('#cred-save').on('click', function () {
  const username     = $('#cred-username').val().trim();
  const sharedSecret = $('#cred-shared-secret').val().trim();
  saveCreds(username, sharedSecret);
  updateCredsStatus();
  $('#credentials-modal').modal('hide');
});

$('#cred-clear').on('click', function () {
  clearCreds();
  $('#cred-username').val('');
  $('#cred-shared-secret').val('');
  updateCredsStatus();
});

$('#reference').val(crypto.randomUUID());
$('#return_path').val(window.location.href.replace(/harness\.html.*$/, 'callback.html'));

updateCredsStatus();

const SANDBOX_BASE = 'https://paynow.pmnts-sandbox.io/v3';
let generatedUrl = null;

const ACTION_LABELS = {
  newtab:   'Open in New Tab',
  redirect: 'Open Payment Page',
  iframe:   'Load in iFrame',
};

function getMode() {
  return $('input[name="submit-mode"]:checked').val();
}

$('input[name="submit-mode"]').on('change', function () {
  const mode = $(this).val();
  $('#action-btn').text(ACTION_LABELS[mode]);
  if (mode !== 'iframe') {
    $('#fz-iframe').attr('src', '');
    $('#iframe-container').hide();
  }
  generatedUrl = null;
  $('#action-btn').prop('disabled', true);
  $('#url-display').hide();
});

function buildHashInput(reference, amount, currency) {
  const parts = [reference, amount, currency];
  if ($('#hide_card_holder').is(':checked')) parts.push('true');
  if ($('#return_path').val())               parts.push($('#return_path').val());
  if ($('#cards').val())                     parts.push($('#cards').val());
  if ($('#surcharge').is(':checked'))        parts.push('true');
  return parts.join(':');
}

function buildUrl(username, reference, currency, amount, hash, mode) {
  let url = `${SANDBOX_BASE}/${username}/${reference}/${currency}/${amount}/${hash}`;

  const params = new URLSearchParams();

  if ($('#return_path').val())               params.set('return_path', $('#return_path').val());
  if ($('#button_text').val())               params.set('button_text', $('#button_text').val());
  if ($('#cards').val())                     params.set('cards', $('#cards').val());
  if ($('#logo_url').val())                  params.set('logo_url', $('#logo_url').val());
  if ($('#css').val())                       params.set('css', $('#css').val());
  if ($('#css_signature').val())             params.set('css_signature', $('#css_signature').val());
  if ($('#tokenize_only').is(':checked'))    params.set('tokenize_only', 'true');
  if ($('#auth').is(':checked'))             params.set('auth', 'true');
  if (!$('#show_email').is(':checked'))      params.set('show_email', 'false');
  if (!$('#show_extras').is(':checked'))     params.set('show_extras', 'false');
  if ($('#hide_card_holder').is(':checked')) params.set('hide_card_holder', 'true');
  if ($('#hide_button').is(':checked'))      params.set('hide_button', 'true');
  if ($('#surcharge').is(':checked'))        params.set('surcharge', 'true');
  if ($('#postmessage').is(':checked'))      params.set('postmessage', 'true');

  if (mode === 'iframe') {
    params.set('iframe', 'true');
    params.set('return_target', '_parent');
  }

  const queryString = params.toString();
  if (queryString) url += '?' + queryString;
  return url;
}

$('#generate').click(function () {
  const creds = loadCreds();

  $('#url-error').hide();
  $('#url-display').hide();
  $('#action-btn').prop('disabled', true);
  generatedUrl = null;

  const errors = [];
  if (!creds || !creds.username)     errors.push('username not set — open Credentials in the nav bar');
  if (!creds || !creds.sharedSecret) errors.push('sharedSecret not set — open Credentials in the nav bar');

  const reference = $('#reference').val().trim();
  const currency  = $('#currency').val().trim();
  const amount    = $('#amount').val().trim();
  const mode      = getMode();

  if (!reference) errors.push('reference is required');
  if (!currency)  errors.push('currency is required');
  if (!amount || isNaN(parseFloat(amount))) errors.push('amount must be a decimal number');

  if (errors.length) {
    $('#url-error').text(errors.join(', ')).show();
    return;
  }

  const username     = creds.username;
  const sharedSecret = creds.sharedSecret;

  const hashInput = buildHashInput(reference, amount, currency);
  const hash      = CryptoJS.HmacMD5(hashInput, sharedSecret).toString();
  const url       = buildUrl(username, reference, currency, amount, hash, mode);

  generatedUrl = url;
  $('#generated-url').val(url);
  $('#hash-input-display').text(hashInput);
  $('#url-display').show();
  $('#action-btn').prop('disabled', false);
});

$('#action-btn').click(function () {
  if (!generatedUrl) return;
  const mode = getMode();

  if (mode === 'newtab') {
    window.open(generatedUrl, '_blank');
  } else if (mode === 'redirect') {
    window.location.href = generatedUrl;
  } else if (mode === 'iframe') {
    $('#fz-iframe').attr('src', generatedUrl);
    $('#iframe-container').show();
    $('html, body').animate({ scrollTop: $('#iframe-container').offset().top - 20 }, 400);
  }
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
