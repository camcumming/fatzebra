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

// Click a row to populate card_number and close the modal
$('#card-list').on('click', 'tr', function () {
  $('#card_number').val($(this).data('number'));
  $('#test-card-modal').modal('hide');
});

const CREDS_COOKIE = 'fz_dp_creds';
const SANDBOX_URL  = 'https://gateway.pmnts-sandbox.io/v2/purchases/direct';

function saveCreds(username, sharedSecret) {
  const value = encodeURIComponent(JSON.stringify({ username, sharedSecret }));
  document.cookie = CREDS_COOKIE + '=' + value +
    '; max-age=3600; Secure; SameSite=Strict; Path=/fatzebra/direct-post/';
}

function loadCreds() {
  const match = document.cookie.split('; ').find(r => r.startsWith(CREDS_COOKIE + '='));
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))); }
  catch (e) { return null; }
}

function clearCreds() {
  document.cookie = CREDS_COOKIE + '=; max-age=0; Secure; SameSite=Strict; Path=/fatzebra/direct-post/';
}

$('#reference').val(crypto.randomUUID());

const saved = loadCreds();
if (saved) {
  $('#username').val(saved.username);
  $('#sharedSecret').val(saved.sharedSecret);
  $('#creds-saved-note').show();
}

$('#clear-creds').on('click', function (e) {
  e.preventDefault();
  clearCreds();
  $('#username').val('');
  $('#sharedSecret').val('');
  $('#creds-saved-note').hide();
});

let pendingRequest = null;

$('#preview').on('click', function () {
  const username     = $('#username').val().trim();
  const sharedSecret = $('#sharedSecret').val().trim();
  const amountRaw    = $('#amount').val().trim();
  const currency     = $('#currency').val().trim();
  const reference    = $('#reference').val().trim();
  const cardHolder   = $('#card_holder').val().trim();
  const cardNumber   = $('#card_number').val().trim();
  const expiryMonth  = $('#expiry_month').val().trim();
  const expiryYear   = $('#expiry_year').val().trim();
  const cvv          = $('#cvv').val().trim();

  $('#preview-error').hide();
  $('#preview-display').hide();
  $('#response-panel').hide();
  $('#submit-btn').prop('disabled', true);
  pendingRequest = null;

  const errors = [];
  if (!username)                                   errors.push('username is required');
  if (!sharedSecret)                               errors.push('sharedSecret is required');
  if (!amountRaw || isNaN(parseFloat(amountRaw))) errors.push('amount must be a decimal number');
  if (!currency)                                   errors.push('currency is required');
  if (!reference)                                  errors.push('reference is required');
  if (!cardHolder)                                 errors.push('card_holder is required');
  if (!cardNumber)                                 errors.push('card_number is required');
  if (!expiryMonth)                                errors.push('expiry_month is required');
  if (!expiryYear)                                 errors.push('expiry_year is required');
  if (!cvv)                                        errors.push('cvv is required');

  if (errors.length) {
    $('#preview-error').text(errors.join(' · ')).show();
    return;
  }

  const amountCents  = Math.round(parseFloat(amountRaw) * 100);
  const hashInput    = reference + ':' + amountCents + ':' + currency;
  const verification = CryptoJS.HmacMD5(hashInput, sharedSecret).toString();
  const url          = SANDBOX_URL + '/' + username + '.json';

  $('#p-url').text(url);
  $('#p-amount').text(amountCents);
  $('#p-currency').text(currency);
  $('#p-reference').text(reference);
  $('#p-hash-input').text(hashInput);
  $('#p-verification').text(verification);
  $('#preview-display').show();
  $('#submit-btn').prop('disabled', false);

  pendingRequest = {
    url, username, sharedSecret,
    data: {
      card_holder:   cardHolder,
      card_number:   cardNumber,
      expiry_month:  expiryMonth,
      expiry_year:   expiryYear,
      cvv:           cvv,
      amount:        amountCents,
      currency:      currency,
      reference:     reference,
      verification:  verification,
    }
  };

  saveCreds(username, sharedSecret);
});

$('#submit-btn').on('click', function () {
  if (!pendingRequest) return;

  $('#submit-btn').prop('disabled', true).text('Submitting…');
  $('#response-panel').hide();

  $.ajax({
    url:          pendingRequest.url,
    dataType:     'jsonp',
    jsonpCallback: 'pmntscb',
    data:          pendingRequest.data,
  })
  .done(function (response) {
    showResponse(response);
  })
  .fail(function (jqXHR, textStatus, error) {
    showError('JSONP request failed: ' + textStatus + (error ? ' — ' + error : ''));
  })
  .always(function () {
    $('#submit-btn').prop('disabled', false).text('Submit');
  });
});

function showResponse(response) {
  const successful = response.r === 1 || response.successful === true || response.successful === 'true';

  const banner = $('#response-banner');
  banner.removeClass('alert-success alert-danger');
  banner.addClass(successful ? 'alert-success' : 'alert-danger');
  banner.html(successful
    ? '<strong>&#10003; Success</strong> — r=' + response.r + (response.message ? ' &mdash; ' + response.message : '')
    : '<strong>&#10007; Failed</strong> — r=' + response.r + (response.message ? ' &mdash; ' + response.message : ''));

  const rows = [];
  const add = (label, val, mono) => {
    if (val !== undefined && val !== null && val !== '') {
      rows.push('<tr><th style="width:35%">' + label + '</th><td class="' + (mono ? 'mono' : '') + '">' + val + '</td></tr>');
    }
  };

  add('r (response code)', response.r, false);
  add('successful',        response.successful, false);
  add('message',           response.message, false);
  add('id',                response.id, true);
  add('token',             response.token, true);
  add('card_holder',       response.card_holder, false);
  add('card_number',       response.card_number, true);
  add('card_expiry',       response.card_expiry, true);
  add('card_type',         response.card_type, false);
  add('auth',              response.auth, true);
  add('amount',            response.amount, false);
  add('currency',          response.currency, false);
  add('reference',         response.reference, true);

  if (response.errors && response.errors.length) {
    rows.push('<tr><th>errors</th><td class="text-danger">' + response.errors.join('<br>') + '</td></tr>');
  }

  $('#response-tbody').html(rows.join(''));
  $('#response-raw').text(JSON.stringify(response, null, 2));
  $('#response-panel').show();
  $('html, body').animate({ scrollTop: $('#response-panel').offset().top - 20 }, 300);
}

function showError(msg) {
  const banner = $('#response-banner');
  banner.removeClass('alert-success alert-danger').addClass('alert-danger');
  banner.html('<strong>&#10007; Request error</strong> &mdash; ' + msg);
  $('#response-tbody').html('');
  $('#response-raw').text('');
  $('#response-panel').show();
}
