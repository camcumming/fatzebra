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

const createRow = function(item) {
  return '<tr style="cursor:pointer" data-number="' + item.number + '">' +
    '<td>' + item.network + '</td>' +
    '<td><code>' + item.number + '</code></td>' +
    '<td>' + item.scenario + '</td>' +
    '</tr>';
};

for (let i = 0; i < testCards.length; i++) {
  cardListContainer.append(createRow(testCards[i]));
}

$('#card-list').on('click', 'tr', function () {
  navigator.clipboard.writeText($(this).data('number'));
  $('#test-card-modal').modal('hide');
});

const CREDS_COOKIE = 'fz_creds';
const COOKIE_PATH  = '/fatzebra/';

function saveCreds(username, sharedSecret, accessKey, accessSecret, accessToken) {
  const merged = Object.assign(loadCreds() || {}, { username, sharedSecret, accessKey, accessSecret, accessToken });
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

function updateCurlCommand() {
  const key    = $('#cred-access-key').val().trim();
  const secret = $('#cred-access-secret').val().trim();
  $('#curl-command').val((key && secret)
    ? 'curl -s -X POST https://api.pmnts-sandbox.io/oauth/token -H \'Content-Type: application/json\' -d \'{"access_key":"' + key + '","access_secret":"' + secret + '"}\''
    : '(enter access_key and access_secret above to generate this command)'
  );
}

$('#credentials-modal').on('show.bs.modal', function () {
  const c = loadCreds() || {};
  $('#cred-access-key').val(c.accessKey || '');
  $('#cred-access-secret').prop('type', 'password').val(c.accessSecret || '');
  $('#cred-username').val(c.username || '');
  $('#cred-shared-secret').prop('type', 'password').val(c.sharedSecret || '');
  $('#cred-access-token').prop('type', 'password').val(c.accessToken || '');
  $('[data-toggle-pw]').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
  updateCurlCommand();
});

$('#cred-access-key, #cred-access-secret').on('input', updateCurlCommand);

$('#copy-curl').on('click', function () {
  const text = $('#curl-command').val();
  if (!text || text.startsWith('(')) return;
  const $btn = $(this);
  navigator.clipboard.writeText(text).then(function () {
    $btn.html('<i class="fa fa-check" aria-hidden="true"></i> Copied!');
    setTimeout(function () { $btn.html('<i class="fa fa-clipboard" aria-hidden="true"></i> Copy'); }, 2000);
  });
});

$(document).on('click', '[data-toggle-pw]', function () {
  const input = document.getElementById($(this).data('togglePw'));
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  $(this).find('i').toggleClass('fa-eye fa-eye-slash');
});

$('#cred-save').on('click', function () {
  const accessKey    = $('#cred-access-key').val().trim();
  const accessSecret = $('#cred-access-secret').val().trim();
  const username     = $('#cred-username').val().trim();
  const sharedSecret = $('#cred-shared-secret').val().trim();
  const accessToken  = $('#cred-access-token').val().trim();
  saveCreds(username, sharedSecret, accessKey, accessSecret, accessToken);
  updateCredsStatus();
  $('#credentials-modal').modal('hide');
});

$('#cred-clear').on('click', function () {
  clearCreds();
  $('#cred-access-key').val('');
  $('#cred-access-secret').val('');
  $('#cred-username').val('');
  $('#cred-shared-secret').val('');
  $('#cred-access-token').val('');
  updateCredsStatus();
  updateCurlCommand();
});

function randomString() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

const SDK_PARAMS = [
  {
    group: 'paymentIntent',
    params: [
      { name: 'amount', default: 100 },
      { name: 'currency', default: 'AUD' },
      { name: 'reference', default: randomString() }
    ]
  },
  {
    group: 'customer',
    params: [
      { name: 'firstName', default: 'John' },
      { name: 'lastName', default: 'Doe' },
      { name: 'email', default: 'john.doe@123.com' },
      { name: 'address', default: '123 Australia Blvd.' },
      { name: 'city', default: 'Sydney' },
      { name: 'postcode', default: '2000' },
      { name: 'state', default: 'NSW' },
      { name: 'country', default: 'AU' }
    ]
  }
]

const HPP_PERMITTED_OPTIONS = [
  { name: 'buttonText', type: 'string', default: '' },
  { name: 'cards', type: 'string', default: '' },
  { name: 'css', type: 'string', default: '' },
  { name: 'cssSignature', type: 'string', default: '' },
  { name: 'logoUrl', type: 'string', default: '' },
  { name: 'hideButton', type: 'boolean', default: false },
  { name: 'hideLogos', type: 'boolean', default: true },
  { name: 'showEmail', type: 'boolean', default: false },
  { name: 'showExtras', type: 'boolean', default: false },
  { name: 'enableSca', type: 'boolean', default: false },
  { name: 'tokenizeOnly', type: 'boolean', default: false }
];

const createTextField = function(item) {
  let input;

  input = "<div class='form-group'>";
  input += "<label for='" + item.name + "' class='control-label'>" + item.name + "</label>";
  input += "<input type='text' id='" + item.name + "' name='" + item.name + "' class='form-control' value='" + item.default + "'>";
  input += "</div>";

  return input;
}

const createCheckBox = function(item) {
  const shouldCheck = item.default ? 'checked' : '';
  let input;

  input = "<div class='form-group form-check'>";
  input += "<input type='checkbox' class='form-check-input' id='" + item.name + "' name='" + item.name + "' value='1' " + shouldCheck + ' />';
  input += "<label class='form-check-label' for='" + item.name + "'>" + item.name + "</label>";
  input += "</div>";

  return input;
}

const sdkOptionsContainer = $('#sdk-options');

for (const group of SDK_PARAMS) {
  sdkOptionsContainer.append('<h4>' + group.group + '</h4>');
  sdkOptionsContainer.append('<hr/>');

  for (const item of group.params) {
    sdkOptionsContainer.append(createTextField(item));
  }

  sdkOptionsContainer.append('<br/>');
}

const paynowOptionsContainer = $('#paynow-options');

for (const option of HPP_PERMITTED_OPTIONS) {
  let input;
  switch(option.type) {
    case 'boolean':
      input = createCheckBox(option);
      break;
    case 'string':
      input = createTextField(option);
      break;
  }
  paynowOptionsContainer.append(input);
}


updateCredsStatus();

$('#show-options').on('change', function () {
  $('#fz-options-wrapper').toggle(this.checked);
});

const OAUTH_URL = 'https://api.pmnts-sandbox.io/oauth/token';

function showResponse(eventName, detail) {
  const data = (detail && detail.data) ? detail.data : (detail || {});
  const successful = eventName === 'fz.payment.success';

  const banner = $('#response-banner');
  banner.removeClass('alert-success alert-danger');
  banner.addClass(successful ? 'alert-success' : 'alert-danger');
  banner.html(successful
    ? '<strong>&#10003; Payment Successful</strong>' + (data.message ? ' &mdash; ' + data.message : '')
    : '<strong>&#10007; Payment Failed</strong>'    + (data.message ? ' &mdash; ' + data.message : ''));

  const rows = [];
  const add = (label, val, mono) => {
    if (val !== undefined && val !== null && val !== '') {
      rows.push('<tr><th style="width:35%">' + label + '</th><td' + (mono ? ' class="mono"' : '') + '>' + val + '</td></tr>');
    }
  };

  add('transaction_id', data.transaction_id, true);
  add('response_code',  data.response_code,  true);
  add('message',        data.message,        false);
  add('amount',         data.amount,         false);
  add('currency',       data.currency,       false);
  add('reference',      data.reference,      true);
  add('card_number',    data.card_number,    true);
  add('card_holder',    data.card_holder,    false);
  add('card_expiry',    data.card_expiry,    true);
  add('card_type',      data.card_type,      false);

  if (detail && detail.errors && detail.errors.length) {
    rows.push('<tr><th>errors</th><td class="text-danger">' + detail.errors.join('<br>') + '</td></tr>');
  }

  $('#response-tbody').html(rows.join(''));
  $('#response-raw').text(JSON.stringify(detail, null, 2));
  $('#response-panel').show();
  $('html, body').animate({ scrollTop: $('#response-panel').offset().top - 20 }, 300);
}

const loadHPP = async function() {
  const creds        = loadCreds() || {};
  const accessKey    = creds.accessKey    || '';
  const accessSecret = creds.accessSecret || '';
  const username     = creds.username     || '';
  const sharedSecret = creds.sharedSecret || '';

  const $btn    = $('#load-hpp');
  const $status = $('#token-status');
  $status.hide().removeClass('text-danger text-success text-warning').text('');
  $('#response-panel').hide();
  $btn.prop('disabled', true).text('Fetching token…');

  let accessToken;
  try {
    const resp = await fetch(OAUTH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ access_key: accessKey, access_secret: accessSecret }),
    });
    const json = await resp.json();
    if (!resp.ok || !json.data || !json.data.token) {
      throw new Error(json.message || 'HTTP ' + resp.status);
    }
    accessToken = json.data.token;
    localStorage.setItem('fz-access-token', accessToken);
    $status.text('OAuth token fetched.').addClass('text-success').show();
  } catch (e) {
    if (creds.accessToken) {
      accessToken = creds.accessToken;
      localStorage.setItem('fz-access-token', accessToken);
      $status.text('Auto-fetch blocked by CORS — using stored token. Tokens expire after 15 min; refresh via Credentials if the form fails to load.').addClass('text-warning').show();
    } else {
      $status.html('Auto-fetch blocked by CORS. Use the curl command in <a href="#" data-toggle="modal" data-target="#credentials-modal">Credentials</a> to get a token and paste it in.').addClass('text-danger').show();
      $btn.prop('disabled', false).text('Load Payments Page');
      return;
    }
  }

  $btn.prop('disabled', false).text('Load Payments Page');
  const amount       = parseInt($('#amount').val());
  const currency     = $('#currency').val();   
  const reference    = $('#reference').val();    
  const firstName    = $('#firstName').val();   
  const lastName     = $('#lastName').val();   
  const email        = $('#email').val();   
  const address      = $('#address').val();    
  const city         = $('#city').val();   
  const postcode     = $('#postcode').val();   
  const state        = $('#state').val();   
  const country      = $('#country').val();

  const verification = CryptoJS.HmacMD5([reference, amount, currency].join(':'), sharedSecret).toString();

  const getPayNowOptions = function() {
    let result = {};

    for (const option of HPP_PERMITTED_OPTIONS) {
      switch(option.type) {
        case 'boolean':
          result[option.name] = $('#' + option.name).is(":checked")
          break;
        case 'string':
          let value = $('#' + option.name).val();
          if (value) {
            result[option.name] = value;
          }
          break;
      }
    }
    return result;
  }

  const fz = new FatZebra({
    username,
    accessToken,
    test: true
  });

  fz.on('fz.sca.success', function(event) {
    console.log('fz.sca.success');
    console.log(JSON.stringify(event.detail))
  })

  fz.on('fz.sca.error', function(event) {
    console.log('fz.sca.error');
    console.log(JSON.stringify(event.detail))
  })

  // fz.validation,error only captures errors related to SDK methods, such as renderPaymentsPage.
  // Please subscribe to fz.form_validation.error for errors related to Hosted Payments Page.
  fz.on('fz.validation.error', function(event) {
    console.log('fz.validation.error');
    console.log(JSON.stringify(event.detail))
  })

  // Capture form validation errors on the Hosted Payments Page.
  // Only subscribe to this event if you'd like to customise call-to-action following validation errors.
  fz.on('fz.form_validation.error', function(event) {
    console.log('fz.form_validation.error');
    console.log(JSON.stringify(event.detail))
  })

  fz.on('fz.tokenization.success', function(event) {
    console.log('fz.tokenization.success');
    console.log(JSON.stringify(event.detail))
  })

  fz.on('fz.tokenization.error', function(event) {
    console.log('fz.tokenization.error');
    console.log(JSON.stringify(event.detail))
  })

  fz.on('fz.payment.success', function(event) {
    console.log('fz.payment.success');
    console.log(JSON.stringify(event.detail));
    showResponse('fz.payment.success', event.detail);
  })

  fz.on('fz.payment.error', function(event) {
    console.log('fz.payment.error');
    console.log(JSON.stringify(event.detail));
    showResponse('fz.payment.error', event.detail);
  })

  fz.renderPaymentsPage({
    containerId: 'fz-iframe',
    customer: {
      firstName,
      lastName,
      email,
      address,
      city,
      postcode,
      state,
      country
    },
    paymentIntent: {
      payment: {
        amount,
        currency,
        reference
      },
      verification
    },
    options: getPayNowOptions()
  })
}

const refreshPage = function() {
  location.reload();
}

$('#load-hpp').click(loadHPP);
$('#reset').click(refreshPage);