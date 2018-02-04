var browser = browser || chrome;

var password = {
  options:{
    digit: true,
    alpha_lowercase: true,
    alpha_uppercase: true,
    special: true,
    length: 12,
    security_level: 10,
    excluded: '',
  },
  passphrase: {
    'clear':'',
    'sha':'',
    'encoded': '',
  },
  url: {
    'clear':'',
    'sha':'',
    'encoded': '',
  },
  password: {
    'clear': '',
    'encoded': '',
  },
	/**
	 *
	 */
  init: function(url, passpĥrase, options) {
    this.passphrase = {
      'clear': passpĥrase,
      'sha':'',
      'encoded': '',
    };
    this.url =  {
      'clear': url,
      'sha':'',
      'encoded': '',
    };
    this.password = {
      'clear': '',
      'encoded': '',
    };
    this.options = options;
  },
  /**
   *
   */
  generate: function() {
    if (this.url != '') {
      this.encode_passphrase();
      this.encode_url();
      this.generate_password();

      return this.password.clear;
    }
    return '';
  },
  /**
   *
   */
  encode_passphrase: function() {
    for (let i=0; i <= this.options.security_level; i++) {
      let string1 = sha512_256(this.passphrase.clear);
      let string2 = sha512_256(this.url.clear);
      this.passphrase.clear = '';

      for (let i=0; i < 32; i++) {
        this.passphrase.clear += string1.charAt(i);
        this.passphrase.clear += string2.charAt(i);
      }

      this.passphrase.sha = sha512_256(this.passphrase.clear);
    }

    for (let i=0; i < this.passphrase.sha.length; i++) {
      this.passphrase.encoded += this.passphrase.sha.codePointAt(i);
    }
  },
  /**
   *
   */
  encode_url: function() {
    for (let i=0; i <= this.options.security_level; i++) {
      let string1 = sha512_256(this.url.clear);
      this.url.clear = '';

      for (let i=0; i < 32; i++) {
        this.url.clear += string1.charAt(i);
        this.url.clear += this.passphrase.sha.charAt(i);
      }

      this.url.sha = sha512_256(this.url.clear);
    }

    for (let i=0; i < this.url.sha.length; i++) {
      this.url.encoded += this.url.sha.codePointAt(i);
    }
  },
  /**
   *
   */
  generate_password: function() {
    let ascii_code = 33;
    let string1 = this.url.encoded;
    let string2 = this.passphrase.encoded;

    if (string1.length < string2.length) {
      string1 = this.passphrase.encoded;
      string2 = this.url.encoded;
    }
    let string2_len = string2.length;

    for (let i=0, j=0; i < string1.length; i++, j++) {
      if (j >= string2_len) {
        j = 0;
      }
      this.password.encoded += string1.codePointAt(i);
      this.password.encoded += string2.codePointAt(j);

      ascii_code += string1.codePointAt(i);
      ascii_code += string2.codePointAt(j);
      if (ascii_code > 126) {
        ascii_code = ascii_code - 126 + 33;
      }
    }

    for (let i=0; i < this.password.encoded.length; i++) {
      ascii_code += parseInt(this.password.encoded.charAt(i));
      if (ascii_code > 126) {
        ascii_code = ascii_code - 126 + 33;
      }
      let next_ascii_code = this.next_ascii_code(ascii_code);
      if (next_ascii_code) {
        this.password.clear += String.fromCodePoint(ascii_code);
        ascii_code = next_ascii_code;
      }
      if (this.password.clear.length == this.options.length) {
        break;
      }
    }
  },
  /**
   *
   * @param {type} code
   * @returns {Number|Boolean}
   */
  next_ascii_code: function(ascii_code) {
    let next_ascii_code = false;
    // 33 - 47 -> !""
    // 48 - 57 -> chiffres
    // 58 - 64 -> :;><?=@
    // 65 - 90 -> Majuscules
    // 91 - 96 -> special [\]^_`
    // 97 - 122 -> minuscules
    // 123 - 126 -> {|}~

    if (ascii_code >= 33 && ascii_code <= 47 && this.options.special) {
      next_ascii_code = 48;
    }
    if (ascii_code >= 48 && ascii_code <= 57 && this.options.digit) {
      next_ascii_code =  58;
    }
    if (ascii_code >= 58 && ascii_code <= 64 && this.options.special) {
      next_ascii_code =  65;
    }
    if (ascii_code >= 65 && ascii_code <= 90 && this.options.alpha_uppercase) {
      next_ascii_code =  91;
    }
    if (ascii_code >= 91 && ascii_code <= 96 && this.options.special) {
      next_ascii_code =  97;
    }
    if (ascii_code >= 97 && ascii_code <= 122 && this.options.alpha_lowercase) {
      next_ascii_code =  123;
    }
    if (ascii_code >= 123 && ascii_code <= 126 && this.options.special) {
      next_ascii_code =  33;
    }
    if (this.options.excluded != '') {
      for (let i=0; i < this.options.excluded.length; i++) {
        if (this.options.excluded.codePointAt(i) == ascii_code) {
          next_ascii_code = false;
        }
      }
    }
    return next_ascii_code;
  },
};
/**
 *
 */
(function (browser, password) {

  const i18n_text = {
    i18n_title: 'Title',
    i18n_passphrase_label: 'PassphraseLabel',
    i18n_options_digits: 'OptionsDigits',
    i18n_options_extra: 'OptionsExtra',
    i18n_options_alpha_uppercase: 'OptionsAlphaUppercase',
    i18n_options_alpha_lowercase: 'OptionsAlphaLowercase',
    i18n_options_length: 'OptionsLength',
    i18n_options_excluded: 'OptionsExcluded',
    i18n_generated_password: 'GeneratedPassword',
    i18n_advice_label: 'AdviceLabel',
    i18n_advice_container: 'AdviceContainer',
    i18n_options_label: 'OptionsLabel',
  }
  const i18n_placeholder = {
    browserActionPassphraseLabelPlaceholder: 'form-passphrase',
    browserActionOptionsExcludedPlaceholder: 'form-excluded',
  }

  let run_generator = function () {
    browser.tabs.query({currentWindow: true, active: true}, function(result) {
        result.forEach(function(tab) {
          let url = tab.url;
          // --
          // https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
          if (url.indexOf("://") > -1) {
            url = url.split('/')[2];
          }
          else {
            url = url.split('/')[0];
          }
          //find & remove port number
          url = url.split(':')[0];
          //find & remove "?"
          url = url.split('?')[0];
          //
          // --
          generate_password(url);
        });
    });
  };

  let generate_password = function(url) {
    let options = {
      digit: document.getElementById("options_digit").checked,
      alpha_uppercase: document.getElementById("options_alpha_uppercase").checked,
      alpha_lowercase: document.getElementById("options_alpha_lowercase").checked,
      special: document.getElementById("options_special").checked,
      length: parseInt(document.getElementById("options_lenght").value),
      security_level: 10,
      excluded: document.getElementById("form-excluded").value,
    }

    password.init(url, document.getElementById("form-passphrase").value, options);
    password.generate();

    document.getElementById('generated-password').classList.remove("hidden");
    document.getElementById('form-generated-password').setAttribute('value', password.password.clear);

  };
  /**
   * Display / Hide tips elements.
   */
  let tips_display = function(element, display = true) {
    let elt = document.getElementById(element);
    let container = document.getElementById(element + '_container');

    if (display == true) {
      elt.setAttribute('data-display', '1');
      container.classList.remove("hidden");
      document.getElementById(element + '_icon').innerHTML = "-";
    }
    else {
      elt.setAttribute('data-display', '0');

      let classString = container.className;
      let newClass = classString.concat(" hidden");
      container.className = newClass;
      document.getElementById(element + '_icon').innerHTML = "+";
    }
  }
  /**
   * Event listener on tips elements
   */
  let tips = function(element) {
    if (document.getElementById(element).getAttribute('data-display') == '0') {
      if (element == 'advice') {
        tips_display('advice', true);
        tips_display('options', false);
      }
      else {
        tips_display('options', true);
        tips_display('advice', false);
      }
    }
    else {
      tips_display('options', false);
      tips_display('advice', false);
    }
  };

  /**
   * Events
   */
  document.getElementById("password-generator").addEventListener("submit",
    function(event){
      event.preventDefault();
      run_generator();
    },
    false
  );
  document.getElementById('advice').addEventListener("click",
    function(event){
      tips('advice');
    },
    false
  );
  document.getElementById('options').addEventListener("click",
    function(event){
      tips('options');
    },
    false
  );
  /**
   * Translations
   */
  for (let [key, value] of Object.entries(i18n_text)){
    document.getElementById(key).innerHTML = browser.i18n.getMessage(value);
  }
  for (let [value, element] of Object.entries(i18n_placeholder)){
    document.getElementById(element).setAttribute('placeholder', browser.i18n.getMessage(value));
  }
  document.getElementById('generate_submit').setAttribute('value', browser.i18n.getMessage('Submit'));



})(browser, password);
