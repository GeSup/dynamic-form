import { ScopedElementsMixin, html, css, LitElement } from '@lion/core';
import '@lion/form/define';
import { LionInput } from '@lion/input';
import { LionSelect } from '@lion/select';
import { LionTextarea } from '@lion/textarea';
import '@lion/checkbox-group/define';
import { LionRadioGroup, LionRadio } from '@lion/radio-group';
import { ajax } from '@lion/ajax';
import { Required, EqualsLength, MinLength, MaxLength } from '@lion/form-core';
import { LionButtonSubmit } from '@lion/button';

Required.getMessage = async (data) => `Wartość pola ${data.fieldName} jest wymagana.`;
EqualsLength.getMessage = async (data) => `Wartość pola ${data.fieldName} nie uzsykała wymaganej ilości znaków. Wymagana długość: ${data.params}`;
MinLength.getMessage = async (data) => `Wartość pola ${data.fieldName} nie osiągneła minimalnej ilości znaków. Minimalna długość: ${data.params}`;
MaxLength.getMessage = async (data) => `Wartość pola ${data.fieldName} przekroczyła maksymalną ilości znaków. Maksymalna długość: ${data.params}`;

export class DynamicForm extends ScopedElementsMixin(LitElement) {

  static get scopedElements() {
    return {  
      'lion-input': LionInput,
      'lion-select': LionSelect,
      'lion-textarea': LionTextarea,
      'lion-radio-group': LionRadioGroup,
      'lion-radio': LionRadio,
      'lion-button-submit': LionButtonSubmit
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 25px;
        color: var(--dynamic-form-text-color, #000);
      }
    `;
  }

  static get properties() {
    return {
      fields: { 
        type: Array,
      },
      textStatus: {
        type: String,
      }
    }
  }  
  
  constructor() {
    super();
    this.fields = [];
    this.__formResults = {};
    ajax.fetchJson('../api/simple-form.json')
    .then(({response, body}) => {
      if (response.status === 200){
        this.fields = this.convertJson(body);
      }
    })
  }

  convertJson(jsonData){
    const dictionary = {
      "name": "imie",
      "surname": "nazwisko",
      "nationality": "narodowość"
    }

    const strToValidator = {
      "required": () => new Required(),
      "max-len": (param) => new MaxLength(param),
      "min-len": (param) => new MinLength(param),
      "len": (param) => new EqualsLength(param),
    }

    const validatorConvert = string => {
      const [strValidator, param] = string.split(':');
      return strToValidator[strValidator](parseInt(param));
    }
    const visibilityConvert = string => {
      if (string === "always") return () => true;
      return () => false;
    }
    const fields = [];
    for (const key of Object.keys(jsonData)) {
      if (jsonData[key].validators) jsonData[key].validators = jsonData[key].validators.map(validatorConvert);
      jsonData[key].visibility = visibilityConvert(jsonData[key].visibility);
      fields.push({
        name: key, 
        label: dictionary[key] || key,
        ...jsonData[key]});
    }
    return fields;
  }

  _templatesForTypes = {
    "text": (data) => html`
      <lion-input label=${data.label} name=${data.name} .validators=${data.validators || []} ?hidden=${!data.visibility()}></lion-input>`,
    "textarea": (data) => html`
       <lion-textarea label=${data.label} name=${data.name} .validators=${data.validators || []} ?hidden=${!data.visibility()}></lion-textarea>`,
    "select": (data) => html`
      <lion-select label=${data.label} name=${data.name} .validators=${data.validators || []} ?hidden=${!data.visibility()}>
        <select slot="input">
          <option selected hidden>Wybierz</option>
          ${data?.dataset.map(option => html`<option value=${option}>${option}</option>`)}
        </select>
      </lion-select>`,
    "checkbox":(data) => html`
      <lion-checkbox-group label=${data.label} name=${data.name} .validators=${data.validators || []} ?hidden=${!data.visibility()}>
        ${data?.dataset.map(checkbox => html`<lion-checkbox label=${checkbox} .choiceValue=${checkbox} ></lion-checkbox>`)}
      </lion-checkbox-group>`,
    'radio-group': (data) => html`
      <lion-radio-group label=${data.label} name=${data.name} .validators=${data.validators || []} ?hidden=${!data.visibility()}>
        ${data?.dataset.map(radio => html`<lion-radio label=${radio} .choiceValue=${radio}></lion-radio>`)}
      </lion-radio-group>`
  }

  _renderByType = (field) => this._templatesForTypes[field.type](field);

  
  _submitHandler(event) {
    if(event.target.hasFeedbackFor.includes('error')){
      const firstWithError = event.target.formElements.find(element => element.hasFeedbackFor.includes('error'));
      firstWithError.focus();
      return;
    }
    event.target.querySelector('lion-button-submit').disabled = true;
    ajax.fetchJson('../api', {
      method: 'POST',
      body: JSON.stringify(event.target.serializedValue),
    })
    .then(({response}) => {
      if (response.status === 200){
        this.textStatus = "Zapisano formularz";
      } else {
        this.textStatus = "Zapis nie powiódł się";
      }
    })
    .catch(err => {
      console.log(err);
      this.textStatus = "Zapis nie powiódł się";
    })
  } 

  render() {
    return html`
      <lion-form @submit=${this._submitHandler}>
        <form>
          ${this.fields.length ? this.fields.map(this._renderByType) : html`<span>Loading...</span>`}
          <lion-button-submit>Zapisz</lion-button-submit> 
        </form>
        <span>${this.textStatus && this.textStatus}</span>
      </lion-form>
    `;
  }
}
