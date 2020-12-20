class testamentForm {
  constructor() {
    setTimeout(() => {
      this.formElement = this.queryFormElement();
      this.formInputElements = this.queryFormInputElements();

      // A JSON object of all forms with values.
      this.cookies = {};

      this.loadCached();
      this.setupInterval();
    }, 100);
  }

  async loadCached() {
    this.cookies = JSON.parse(this.loadCookie());
    Object.entries(this.cookies).forEach(([id, value]) => {
      document.getElementById(id).value = value;
    });
  }

  // TODO: Set the cookie name to a const value
  loadCookie() {
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf("testamentForm=") === 0) {
        return c.substring("testamentForm=".length, c.length);
      }
    }
    return "";
  }

  saveCookie() {
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + 360 * 24 * 60 * 60 * 1000);

    let expires = "expires=" + expireDate.toUTCString();

    // Maybe set the path to the current location of the form.
    document.cookie =
      "testamentForm" +
      "=" +
      JSON.stringify(this.cookies) +
      ";" +
      expires +
      ";path=/";
  }

  async setupInterval() {
    setTimeout(() => {
      setInterval(() => {
        this.saveContent().then(() => {
          this.saveCookie();
        });
      }, 1000);
    }, 1000);
  }

  async saveContent() {
    // Man könnte auch nach input elementen suchen die eine value haben
    // anstelle durch alle durchzuprüfen.
    this.formInputElements.forEach(async (formElement) => {
      const value = formElement.value;
      if (value != null && value != "") {
        this.cookies[formElement.id] = value;
      }
    });

    //TODO: call async only on "weiter-button"
  }

  // Improve queries using xPath
  queryFormInputElements() {
    // Remove the slice and query elements properly
    return Array.from(this.formElement.querySelectorAll("input, select")).slice(
      0,
      10
    );
  }

  queryFormElement() {
    return document.querySelector('form[id*="wpforms-form"]');
  }
}

var foo = new testamentForm();
