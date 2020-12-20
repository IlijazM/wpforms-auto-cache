//#region Polyfill
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Polyfill
if (!Object.entries) {
    Object.entries = function (obj) {
        var ownProps = Object.keys(obj), i = ownProps.length, resArray = new Array(i); // preallocate the Array
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        return resArray;
    };
}
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, "includes", {
        value: function (searchElement, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            // 1. Let O be ? ToObject(this value).
            var o = Object(this);
            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;
            // 3. If len is 0, return false.
            if (len === 0) {
                return false;
            }
            // 4. Let n be ? ToInteger(fromIndex).
            //    (If fromIndex is undefined, this step produces the value 0.)
            var n = fromIndex | 0;
            // 5. If n ≥ 0, then
            //  a. Let k be n.
            // 6. Else n < 0,
            //  a. Let k be len + n.
            //  b. If k < 0, let k be 0.
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            function sameValueZero(x, y) {
                return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
            }
            // 7. Repeat, while k < len
            while (k < len) {
                // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                // b. If SameValueZero(searchElement, elementK) is true, return true.
                if (sameValueZero(o[k], searchElement)) {
                    return true;
                }
                // c. Increase k by 1.
                k++;
            }
            // 8. Return false
            return false;
        },
    });
}
//#endregion
/**
 * Will scan over a form element from the wordpress plugin WPForms and cache the input element automatically in the cookies.
 *
 * <p>
 * There is a problem when the input elements takes up to much memory. Then the cookie cannot be saved because of the
 * limitations of the size of the cookies.
 * </p>
 *
 * @author Ilijaz Mehmedovic
 */
class AutoCacheForm {
    /**
     * Default constructor.
     *
     * @param formElement the form element.
     */
    constructor(formElement) {
        this.formElement = formElement;
        /**
         * The expire date of a cookie which is set to 1 year.
         */
        this.cookieExpireDate = 360 * 24 * 60 * 60 * 1000;
        /**
         * The name of the cookie.
         */
        this.cookieName = "wpfromscache";
        /**
         * A record of the input values of the input elements that will get stored in the cookies.
         */
        this.inputValues = {};
        /**
         * If set true the class will save the form data using an interval.
         */
        this.reloadInInterval = false;
        /**
         * The time of the interval that will save the form data in milliseconds.
         */
        this.saveIntervalDuration = 5000;
    }
    /**
     * Returns an array of nodes of a xPath.
     *
     * @param xPath the xPath of the element.
     * @param parent the parent element. It defaults to the document.
     * @return an array of nodes.
     */
    static $(xPath, parent = undefined) {
        const result = [];
        const nodesSnapshot = document.evaluate(xPath, parent || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
            result.push(nodesSnapshot.snapshotItem(i));
        }
        return result;
    }
    /**
     * Saves the cookie that stores the information of the form.
     */
    saveCookie() {
        const expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + this.cookieExpireDate);
        let expires = "expires=" + expireDate.toUTCString();
        //TODO: shorten the id.
        document.cookie = this.cookieName + "=" + JSON.stringify(this.inputValues) + ";" + expires + ";path=/";
    }
    /**
     * Loads the cookie that stores the information of the form.
     *
     * @return the input values json object as string.
     */
    loadCookies() {
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(this.cookieName + "=") === 0) {
                return c.substring((this.cookieName + "=").length, c.length);
            }
        }
        return "";
    }
    /**
     * Will setup the form
     */
    setup() {
        if (this.reloadInInterval) {
            this.setupInterval();
        }
        setTimeout(() => {
            this.loadForm();
            this.addEventToInputElements();
            this.addEventToNextButtons();
        }, 200);
    }
    /**
     * Sets up an interval that automatically saves the form.
     */
    setupInterval() {
        setInterval(() => {
            this.saveForm();
        }, this.saveIntervalDuration);
    }
    /**
     * Reloads the form from the cookies.
     */
    loadForm() {
        const inputValues = this.loadCookies();
        if (inputValues.trim() === "") {
            this.inputValues = {};
        }
        else {
            this.inputValues = JSON.parse(inputValues);
        }
        for (const [id, value] of Object.entries(this.inputValues)) {
            const element = AutoCacheForm.$(`.//*[@id='${id}']`, this.formElement)[0];
            this.setInputValue(element, value);
        }
    }
    /**
     * Saves the form in the cookies.
     */
    saveForm() {
        return __awaiter(this, void 0, void 0, function* () {
            const formInputElements = this.getAllFormInputElements();
            for (const formInputElement of formInputElements) {
                let value = this.readInputValue(formInputElement);
                if (value === "" || value == null || value == false) {
                    value = undefined;
                }
                this.inputValues[formInputElement.id] = value;
            }
            this.saveCookie();
        });
    }
    /**
     * Reads the value of an content and returns it.
     *
     * @param pElement the form element.
     * @return the value of the form element.
     */
    readInputValue(pElement) {
        if (pElement.tagName === "SELECT") {
            return pElement.value;
        }
        if (pElement.tagName === "TEXTAREA") {
            return pElement.value;
        }
        if (pElement.tagName !== "INPUT") {
            return null;
        }
        if (["text", "number", "tel", "email"].includes(pElement.type)) {
            return pElement.value;
        }
        if (pElement.type === "checkbox" || pElement.type === "radio") {
            return pElement.checked;
        }
        return null;
    }
    /**
     * Sets the value to the form element.
     *
     * @param pElement the form element.
     * @param pValue the value of the form element that should get set as string.
     */
    setInputValue(pElement, pValue) {
        const changeEvent = document.createEvent("HTMLEvents");
        changeEvent.initEvent("change", true, true);
        changeEvent.eventName = "change";
        if (pElement.tagName === "SELECT") {
            pElement.value = pValue;
            pElement.dispatchEvent(changeEvent);
            return;
        }
        if (pElement.tagName === "TEXTAREA") {
            pElement.value = pValue;
            return;
        }
        if (pElement.tagName !== "INPUT") {
            return;
        }
        if (["text", "number", "tel", "email"].includes(pElement.type)) {
            pElement.value = pValue;
            pElement.dispatchEvent(changeEvent);
            return;
        }
        if (pElement.type === "checkbox" || pElement.type === "radio") {
            if (pValue === "true" || pValue === true) {
                pElement.checked = true;
            }
            else {
                pElement.checked = false;
            }
            pElement.dispatchEvent(changeEvent);
            return;
        }
    }
    /**
     * Adds an event listener to all "next" buttons that will save the form whenever
     * an element calls the "click" event.
     */
    addEventToNextButtons() {
        const nextButtonElements = this.getNextButtonElements();
        for (const nextButtonElement of nextButtonElements) {
            nextButtonElement.addEventListener("click", () => {
                this.saveForm();
            });
        }
    }
    /**
     * Adds and event listener to all input elements that will save the form whenever
     * an element calls the "change" event.
     */
    addEventToInputElements() {
        const allInputElements = this.getAllFormInputElements();
        for (const inputElement of allInputElements) {
            inputElement.addEventListener("change", () => {
                this.saveForm();
            });
        }
    }
    /**
     * Identifies the id of the form by reading the suffix of the wpforms-form-* id.
     *
     * @return the id of the form.
     */
    getFormId() {
        return "";
    }
    /**
     * Returns an array of all next buttons as nodes.
     *
     * @return an array of all next buttons as nodes.
     */
    getNextButtonElements() {
        return AutoCacheForm.$("//button[@class='wpforms-page-button wpforms-page-next']");
    }
    /**
     * Returns all input elements on the form as nodes.
     *
     * @returns all input elements on the form as nodes.
     */
    getAllFormInputElements() {
        return AutoCacheForm.$(".//*[self::input or self::select or self::textarea]", this.formElement);
    }
}
const form = AutoCacheForm.$("//form[@id[contains(.,'wpforms-form')]]")[0];
const testamentForm = new AutoCacheForm(form);
// Uncomment to add an interval that automatically saves the form every 5 seconds.
// testamentForm.reloadInInterval = true;
testamentForm.setup();
