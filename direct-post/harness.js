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
    '<tr><td>' + c.network + '</td><td><code>' + c.number + '</code></td><td>' + c.scenario + '</td></tr>'
  );
}

const CREDS_COOKIE  = 'fz_dp_creds';
const SANDBOX_BASE  = 'https://gateway.pmnts-sandbox.io/v2/purchases/direct';

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
$('#return_path').val(window.location.href.replace('harness.html', 'callback.html'));

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

$('#preview').on('click', function () {
  const username     = $('#username').val().trim();
  const sharedSecret = $('#sharedSecret').val().trim();
  const amountRaw    = $('#amount').val().trim();
  const currency     = $('#currency').val().trim();
  const reference    = $('#reference').val().trim();
  const returnPath   = $('#return_path').val().trim();
  const cardHolder   = $('#card_holder').val().trim();
  const cardNumber   = $('#card_number').val().trim();
  const expiryMonth  = $('#expiry_month').val().trim();
  const expiryYear   = $('#expiry_year').val().trim();
  const cvv          = $('#cvv').val().trim();

  $('#preview-error').hide();
  $('#preview-display').hide();
  $('#submit-payment').prop('disabled', true);

  const errors = [];
  if (!username)                                       errors.push('username is required');
  if (!sharedSecret)                                   errors.push('sharedSecret is required');
  if (!amountRaw || isNaN(parseFloat(amountRaw)))      errors.push('amount must be a decimal number');
  if (!currency)                                       errors.push('currency is required');
  if (!reference)                                      errors.push('reference is required');
  if (!returnPath)                                     errors.push('return_path is required');
  if (!cardHolder)                                     errors.push('card_holder is required');
  if (!cardNumber)                                     errors.push('card_number is required');
  if (!expiryMonth)                                    errors.push('expiry_month is required');
  if (!expiryYear)                                     errors.push('expiry_year is required');
  if (!cvv)                                            errors.push('cvv is required');

  if (errors.length) {
    $('#preview-error').text(errors.join(' · ')).show();
    return;
  }

  const amountCents = Math.round(parseFloat(amountRaw) * 100);
  const hashInput   = reference + ':' + amountCents + ':' + currency + ':' + returnPath;
  const verification = CryptoJS.HmacMD5(hashInput, sharedSecret).toString();
  const formAction   = SANDBOX_BASE + '/' + username + '.json';

  // Populate hidden fields
  $('#h-amount').val(amountCents);
  $('#h-currency').val(currency);
  $('#h-reference').val(reference);
  $('#h-return_path').val(returnPath);
  $('#h-verification').val(verification);
  $('#dp-form').attr('action', formAction);

  // Show preview table
  $('#p-action').text(formAction);
  $('#p-amount').text(amountCents);
  $('#p-currency').text(currency);
  $('#p-reference').text(reference);
  $('#p-return-path').text(returnPath);
  $('#p-hash-input').text(hashInput);
  $('#p-verification').text(verification);

  $('#preview-display').show();
  $('#submit-payment').prop('disabled', false);

  saveCreds(username, sharedSecret);
});

$('#submit-payment').on('click', function () {
  $('#dp-form').submit();
});
