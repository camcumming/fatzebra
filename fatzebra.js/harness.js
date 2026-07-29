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

function saveCreds(username, sharedSecret, accessToken) {
  const value = encodeURIComponent(JSON.stringify({ username, sharedSecret, accessToken: accessToken || '' }));
  document.cookie = CREDS_COOKIE + '=' + value +
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
  $('#cred-access-token').val(c.accessToken || '');
  $('#cred-username').val(c.username || '');
  $('#cred-shared-secret').val(c.sharedSecret || '');
});

$('#cred-save').on('click', function () {
  const accessToken  = $('#cred-access-token').val().trim();
  const username     = $('#cred-username').val().trim();
  const sharedSecret = $('#cred-shared-secret').val().trim();
  saveCreds(username, sharedSecret, accessToken);
  updateCredsStatus();
  $('#credentials-modal').modal('hide');
});

$('#cred-clear').on('click', function () {
  clearCreds();
  $('#cred-access-token').val('');
  $('#cred-username').val('');
  $('#cred-shared-secret').val('');
  updateCredsStatus();
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
  { name: 'enableSca', type: 'boolean', default: true },
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

const loadHPP = function() {
  const creds        = loadCreds() || {};
  const accessToken  = creds.accessToken || '';
  const username     = creds.username || '';
  const sharedSecret = creds.sharedSecret || '';
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
    console.log(JSON.stringify(event.detail))
    // Verify data integrity with your backend via ajax before consuming transaction data.
    alert('payment success!');
    
  })

  fz.on('fz.payment.error', function(event) {
    console.log('fz.payment.error');
    console.log(JSON.stringify(event.detail))
    alert('payment error!');
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